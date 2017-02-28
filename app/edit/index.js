var _ = require('lodash')
var React = require('react-native')
var Icon  =  require('react-native-vector-icons/Ionicons')
var ImagePicker = require('react-native-image-picker')
var Video = require('react-native-video').default
var CountDown = require('react-native-sk-countdown').CountDownText
import {AudioRecorder, AudioUtils} from 'react-native-audio';
import Button from 'react-native-button'
var Progress = require('react-native-progress')

var config = require('../common/config')
var request = require('../common/request')

var StyleSheet = React.StyleSheet
var Text = React.Text
var View = React.View
var TouchableOpacity = React.TouchableOpacity
var Image = React.Image
var Dimensions = React.Dimensions
var AsyncStorage = React.AsyncStorage
var ProgressViewIOS = React.ProgressViewIOS
var AlertIOS = React.AlertIOS
var Modal = React.Modal
var TextInput = React.TextInput

var width = Dimensions.get('window').width
var height = Dimensions.get('window').height
var photoOptions = {
        title: '选择视频',
        cancelButtonTitle:'取消',
        takePhotoButtonTitle:'录制10秒视频',
        chooseFromLibraryButtonTitle:'选择已有视频',
        VideoQuality:'medium',
        mediaType:'video',
        durationLimit:10,
        noData:false,
        storageOptions: { 
          skipBackup: true, 
          path: 'images'
        }
      };
var defaultState = {
        previewVideo: null,
        title:null,
        modalVisible:false,
        publishing: false,
        willPublish: false,
        publishProgress:0.2,
        //video loads
        rate:1,
        muted:true,
        resizeMode:'contain',
        repeat:false,
        videoProgress:0.01,
        videoTotal:0,
        currentTime:0,
        //videoupload
        videoUploaded:false,
        videoUploading:false,
        videoUploadProgress:0.01,
        video:null,
        //audio
        audio:null,
        audioPath:AudioUtils.DocumentDirectoryPath + '/gougou.aac',
        audioPlaying:false,
        recordDone:false,
        recording:false,
        counting:false,
        audioUploaded:false,
        audioUploading:false,
        audioUploadProgress:0.01,
        videoId:null,
        audioId:null,
}
var Edit = React.createClass({
    getInitialState(){
      var user = this.props.user || {}
      var state = _.clone(defaultState)
      state.user = user
      return state
    },
    _closeModal(){
      this.setState({
        modalVisible:false,
      })
    },
    _showModal(){
      this.setState({
        modalVisible:true,
      })
    },
    _submit(){
      var body = {
        title:this.state.title,
        videoId:this.state.videoId,
        audioId:this.state.audioId
      }

      var creativeURL = config.api.base + config.api.creative
      var user = this.state.user
      console.log(body)
      if(user && user.accessToken){
        body.accessToken = user.accessToken
        this.setState({
          publishing:true
        })
        request.post(creativeURL,body)
          .catch((err)=>{
            console.log(err)
             this.setState({
                  publishing:false
              })
            AlertIOS.alert('视频发布失败')
          })
          .then((data)=>{
            if(data && data.success){
              this._closeModal()
              AlertIOS.alert('视频发布成功')
              var state = _.clone(defaultState)
              this.setState(state)
            }
            else{
              this.setState({
                  publishing:false
              })
              AlertIOS.alert('视频发布失败')
            }
          })
      }
    },
    componentDidMount(){
      AsyncStorage.getItem('user')
        .then((data)=>{
          console.log(data);
          var user
          if(data){
            user = JSON.parse(data)
          }
          //user.avatar = ''
          //AsyncStorage.setItem('user',JSON.stringify(user))
          if(user && user.accessToken){
            this.setState({
             
              user:user
            })
          }
        })
      this._initAudio()
    },
    _uploadAudio(){
      var tags = 'app,audio'
      var folder= 'audio'
      var timestamp = Date.now()
      var signatureURL = config.api.base+config.api.signature
      var accessToken = this.state.user.accessToken
      request.post(signatureURL,{
          accessToken:accessToken,
          cloud: 'cloudinary',
          type:'audio',
          timestamp:timestamp
        })
        .then((data)=>{
          if(data && data.success){
            var signature = data.data.token
            var key = data.data.key
            var body = new FormData()
            body.append('folder',folder)
            body.append('signature',signature)
            body.append('tags',tags)
            body.append('timestamp',timestamp)
            body.append('api_key',config.cloudinary.api_key)
            body.append('resource_type','video')
            body.append('file',{
              type:'video/mp4',
              uri:this.state.audioPath,
              name:key
            })
            console.log(body)
            this._upload(body,'audio')
          }
        })
        .catch((err)=>{
          console.log(err)
        })
    },
    _initAudio(){
      var audioPath = this.state.audioPath
     
      console.log(audioPath)
      AudioRecorder.prepareRecordingAtPath(audioPath, {
        SampleRate: 22050,
        Channels: 1,
        AudioQuality: "High",
        AudioEncoding: "aac",
        AudioEncodingBitRate: 32000
      });
      AudioRecorder.onProgress = (data) => {
        this.setState({currentTime: Math.floor(data.currentTime)});
      };
      AudioRecorder.onFinished = (data) => {
        this.setState({finished: data.finished});
        
      };
    },
    _onLoadStart(){
      
    },
    _onLoad(){
      
    },
    _onProgress(data){
      
      var duration = data.playableDuration
      var currentTime = data.currentTime
      var percent = Number((currentTime / duration).toFixed(2)) 
      
      this.setState({
        videoTotal : duration,
        currentTime : Number(currentTime.toFixed(2)),
        videoProgress:percent
      })
    },
    _onEnd(){
      if(this.state.recording){
        AudioRecorder.stopRecording()
        this.setState({
          videoProgress : 1,
          recording:false,
          recordDone:true
        })
      }
    },
    _onError(e){
      this.setState({
        videoOk:false
      })
    
    },
    _preview(){
      if(this.state.audioPlaying){
        AudioRecorder.stopPlaying()
      }
      this.setState({
        audioPlaying:true,
        videoProgress:0
      })
      AudioRecorder.playRecording()
      this.refs.videoPlayer.seek(0)
    },
    _counting(){
      if(!this.state.counting && !this.state.recording & !this.state.audioPlaying){
        this.setState({
          counting:true
        })
        this.refs.videoPlayer.seek(this.state.videoTotal - 0.01)
      }
     
    },
    _record(){
      this.setState({
        videoProgress:0,
        counting:false,
        recording:true,
        recordDone:false
      })
      AudioRecorder.startRecording()
      this.refs.videoPlayer.seek(0)
    },
    _pickVideo(){
      ImagePicker.showImagePicker(photoOptions, (response) => {

        if (response.didCancel) {
          return
        }
        var state = _.clone(defaultState)
        var uri = response.uri
        state.previewVideo = uri
        state.user = this.state.user

        this.setState(state)
        var signatureURL = config.api.base+config.api.signature
        var accessToken = this.state.user.accessToken
        request.post(signatureURL,{
          accessToken:accessToken,
          cloud: 'qiniu',
          type:'video'
        })
        .then((data)=>{
          if(data && data.success){
            var token = data.data.token
            var key = data.data.key
            var body = new FormData()
            body.append('token',token)
            body.append('key',key)
            body.append('file',{
              type:'video/mp4',
              uri:uri,
              name:key
            })
            console.log(body)
            this._upload(body,'video')
          }
        })
       
      });
    },
    _upload(body,type){
      var xhr = new XMLHttpRequest()
      var url = config.qiniu.upload
      if(type === 'audio'){
        url = config.cloudinary.video
      }
      var state = {}
      state[type+'Progress'] = 0
      state[type+'Uploaded'] = false
      state[type+'Uploading'] = true
      this.setState(state)
      xhr.open('POST',url)
      xhr.onload = () =>{
        if(xhr.status !== 200){
          AlertIOS.alert('请求失败')
          console.log(xhr.responseText)
          return
        }
        if(!xhr.responseText){
          AlertIOS.alert('请求失败')
          return
        }
        var response
        try{
          response = JSON.parse(xhr.response)
        }
        catch(e){
          console.log(e)
        }
        if(response){
          console.log(response)
          var newState = {}
          newState[type] = response
          newState[type+'Uploaded'] = true
          newState[type+'Uploading'] = false

          this.setState(newState)
       
         var updateURL = config.api.base + config.api[type]
         var accessToken = this.state.user.accessToken
         var updateBody = {
            accessToken:accessToken
         }
         updateBody[type] = response
         if(type === 'audio'){
          updateBody.videoId = this.state.videoId
         }
         request.post(updateURL,updateBody)
         .catch((err)=>{
            console.log(err)
            if(type === 'video'){
              AlertIOS.alert('视频同步出错，请重新上传')
            }else if(type==='audio'){
              AlertIOS.alert('音频同步出错，请重新上传')
            }
            
         })
         .then((data)=>{
            if(data && data.success){
              var meidiaState = {}
              meidiaState[type+'Id'] = data.data
              if(type === 'audio'){
                this._showModal()
                meidiaState.willPublish = true
              }
              this.setState(meidiaState)

            }else{
              if(type === 'video'){
                AlertIOS.alert('视频同步出错，请重新上传')
              }else if(type==='audio'){
                AlertIOS.alert('音频同步出错，请重新上传')
              }
            }
         })

        }
      }
      if(xhr.upload){
        xhr.upload.onprogress = (event) => {
          if(event.lengthComputable){
            var percent = Number((event.loaded / event.total).toFixed(2))
            var progressState = {}
            progressState[type+'UploadProgress'] = percent
            this.setState(progressState)
          }
        }
      }
      xhr.send(body)
    
    },
    render(){
      return (

        <View style={styles.container}>
          <View style={styles.toolBar}>
             <Text style={styles.toolBarTitle}>
              {this.state.previewVideo ? '点击开始配音' : '理解狗狗,从配音开始'}
             </Text>
             {
                this.state.previewVideo && this.state.videoUploaded
               ?<Text style={styles.toolBarEdit} onPress={this._pickVideo}>更换视频</Text>
               :null
             }
          </View>
          <View style={styles.page}>
              {
                this.state.previewVideo
                ?<View style={styles.videoContainer}>
                  <View style={styles.videoBox}>
                    <Video
                      ref='videoPlayer'
                      style={styles.video}
                      source={{uri:this.state.previewVideo}}
                      volume={3}
                      paused={this.state.paused}
                      rate={this.state.rate}
                      muted={this.state.muted}
                      resizeMode={this.state.resizeMode}
                      repeat={this.state.repeat}

                      onLoadStart={this._onLoadStart}
                      onLoad={this._onLoad}
                      onProgress={this._onProgress}
                      onEnd={this._onEnd}
                      onError={this._onError}/>
                      {
                        this.state.videoUploading && !this.state.videoUploaded
                        ?
                        <View style={styles.videoTipsBox}>
                          <ProgressViewIOS style={styles.progressBar} progressTintColor="#ee735c" progress={this.state.videoUploadProgress} />
                          <Text style={styles.progressTip}>
                            正在生成静音视频，已完成{(this.state.videoUploadProgress*100).toFixed(2)}%
                          </Text>
                        </View>
                        :null
                      }
                      {
                         this.state.recording || this.state.audioPlaying
                         ?<View style={styles.videoTipsBox}>
                            <ProgressViewIOS style={styles.progressBar} progressTintColor="#ee735c" progress={this.state.videoProgress} />
                            {
                              this.state.recording
                              ?<Text style={styles.progressTip}>
                                录制声音中，已完成{(this.state.videoProgress*100).toFixed(2)}%
                              </Text>
                              :null
                            }
                            
                          </View>
                         :null
                      }
                      {
                        this.state.recordDone
                        ?<View style={styles.previewBox}>
                          <Icon name='ios-play' style={styles.previewIcon} />
                          <Text style={styles.previewText} onPress={this._preview}>
                            预览
                          </Text>
                        </View>
                        :null
                      }
                  </View>
                </View>
                :<TouchableOpacity style={styles.uploadContainer} onPress={this._pickVideo}>
                  <View style={styles.uploadBox}>
                    <Image source={require('../assets/images/upload.png')}  style={styles.uploadIcon}/>
                    <Text style={styles.uploadTitle}>点我上传视频</Text>
                    <Text style={styles.uploadTip}>建议时长不要超过20秒</Text>
                  </View>
                </TouchableOpacity>
              }
          
              {
                this.state.videoUploaded
                ? <View style={styles.recordBox}>
                <View style={[styles.recordIconBox,(this.state.recording || this.state.audioPlaying) && styles.recordOn]}>
                    { 
                      this.state.counting && !this.state.recording
                      ? <CountDown
                          style={styles.countDownIcon}
                          countType='seconds' // 计时类型：seconds / date
                          auto={true} // 自动开始
                          afterEnd={this._record} // 结束回调
                          timeLeft={3} // 正向计时 时间起点为0秒
                          step={-1} // 计时步长，以秒为单位，正数则为正计时，负数为倒计时
                          startText='准备录制' // 开始的文本
                          endText='Go' // 结束的文本
                          intervalText={(sec) => {
                            return sec === 0 ? 'Go' : sec
                          }} />
                      : <TouchableOpacity onPress={this._counting}>
                          <Icon
                            name="ios-mic"
                            style={styles.recordIcon} />
                        </TouchableOpacity>
                    }
                   
                  </View>
                </View>
                :null
              }
              
              {
                this.state.videoUploaded && this.state.recordDone
                ?<View style={styles.audioUploadBox}>
                    {
                      !this.state.audioUploading && !this.state.audioUploaded
                      ?<Text style={styles.audioText} onPress={this._uploadAudio}>下一步</Text>
                      :null
                    }
                    {
                      this.state.audioUploading
                      ? <Progress.Circle 
                          size={75}
                          showsText={true}
                          color={'#ee735c'}
                          progress = {this.state.audioUploadProgress} />
                      :null
                    }
                   
                  </View>
                :null
              }
              
              
           </View> 
           <Modal
            animated={true}
            visible={this.state.modalVisible}>
              <View style={styles.modalContainer}>
                <Icon
                  name='ios-close-outline'
                  style={styles.closeIcon} 
                  onPress={this._closeModal} />
                {
                  this.state.audioUploaded && !this.state.publishing
                  ?<View style={styles.fieldBox}>
                      <TextInput
                        placeholder={'给狗狗一句宣言'}
                        style={styles.inputField}
                        autoCapitalize={'none'}
                        autoCorrect={false}
                        defaultValue={this.state.title}
                        onChangeText={
                          (text)=>{
                            this.setState({
                              title:text
                            })
                          }
                        } />
                    </View>
                  :null
                }
                {
                  this.state.publishing
                  ? <View style={styles.loadingBox}>
                     <Text style={styles.loadingText}>
                      耐心等一下,拼命为您生成专属视频中...
                     </Text>
                     {
                      this.state.willPublish
                      ?<Text style={styles.loadingText}>
                          正在合并视频...
                        </Text>
                      :null
                     }
                     {
                      this.state.publishProgress > 0.3
                      ?<Text style={styles.loadingText}>
                        开始上传咯...
                       </Text>
                      :null
                     }
                     <Progress.Circle 
                        size={60}
                        showsText={true}
                        color={'#ee735c'}
                        progress = {this.state.publishProgress} />
                    </View>
                  :null
                }
               
                <View style={styles.submitBox} >
                  {
                    this.state.audioUploaded && !this.state.publishing
                    ?<Button
                      style={styles.btn}
                      onPress={this._submit}>发布视频</Button>
                    :null
                  }
                </View>
              </View>
            </Modal>
          
        </View>
      )
    }
})


const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  toolBar:{
    paddingTop:25,
    paddingBottom:12,
    flexDirection:'row',
    backgroundColor:'#ee735c'
  },
  toolBarTitle:{
    fontSize:16,
    flex:1,
    color:'#fff',
    textAlign:'center',
    fontWeight:'600'
  },
  toolBarEdit:{
    fontSize:14,
    fontWeight:'600',
    position:'absolute',
    right:10,
    top:28,
    textAlign:'right',
    color:'#fff'
  },
  page:{
    flex:1,
    backgroundColor:'#fff',
    alignItems:'center'
  },
  uploadIcon:{
    width:110,
    height:110,
    resizeMode:'contain'
  }, 
  uploadContainer:{
    marginTop:90,
    width:width-40,
    
    paddingBottom:10,
    justifyContent:'center',
    backgroundColor:'#fff',
    borderRadius:8,
    borderWidth:1,
    borderColor:'#ee735c'
  },
  uploadTitle:{
    textAlign:'center',
    fontSize:16,
    marginBottom:10,
    color:'#000',
    marginTop:10
  },
  uploadTip:{
    fontSize:12,
    color:'#999',
    textAlign:'center'
  },
  uploadBox:{
    flex:1,
    flexDirection:'column',
    justifyContent:'center',
    alignItems:'center'
  },
  videoContainer:{
    width:width,
    justifyContent:'center',
    alignItems:'flex-start'
  },
  videoBox:{
    width:width,
    height:height*0.6,
  },
  video:{
    width:width,
    height:height*0.6,
    backgroundColor:'#333'
  },
  videoTipsBox:{
    position:'absolute',
    bottom:0,
    left:0,
    width:width,
    height:30,
    backgroundColor:'rgba(244,244,244,0.65)'
  },
  progressTip:{
    color:'#333',
    width:width-10,
    padding:5
  },
  progressBar:{
    width:width
  },
  recordBox:{
    width:width,
    height:60,
    alignItems:'center',
  },
  recordIconBox:{
    marginTop:-30,
    width:68,
    height:68,
    borderRadius:34,
    borderColor:'#ee735c',
    borderWidth:1,
    backgroundColor:'#ee735c',
    alignItems:'center',
    justifyContent:'center'
  },
  recordIcon:{
    fontSize:50,
    backgroundColor:'transparent',
    color:'#fff'
  },
  countDownIcon:{
    fontSize:32,
    fontWeight:'600',
    color:'#fff'
  },
  recordOn:{
    borderColor:'#ccc',
    backgroundColor:'#ccc'
  },
  previewBox:{
    width:80,
    height:30,
    position: 'absolute',
    right: 10,
    bottom: 10,
    borderWidth:1,
    borderColor:'#ee735c',
    borderRadius:3,
    flexDirection:'row',
    alignItems:'center',
    justifyContent:'center'
  },
  previewIcon:{
    marginRight:5,
    fontSize:20,
    color:'#ee735c',
    backgroundColor: 'transparent'
  },
  previewText:{
    fontSize:20,
    color:'#ee735c',
    backgroundColor: 'transparent'
  },
  audioUploadBox:{
    width:width,
    height:60,
    alignItems:'center',
    justifyContent:'center',
    flexDirection:'row'
  },
  audioText:{
    width:width-30,
    padding:5,
    fontSize:25,
    color:'#ee735c',
    backgroundColor:'transparent',
    textAlign:'center',
    borderRadius:5,
    borderWidth:1,
    borderColor:'#ee735c'
  },
  modalContainer:{
    width:width,
    height:height,
    paddingTop:50,
    backgroundColor:'#fff'
  },
  inputField:{
    height:36,
    textAlign:'center',
    color:'#666',
    fontSize:14
  },
  loadingBox:{
    width:width,
    height:50,
    marginTop:10,
    padding:15,
    alignItems:'center'
  },
  fieldBox:{
    width:width-40,
    marginLeft:20,
    marginRight:20,
    height:36,
    borderBottomWidth:1,
    borderBottomColor:'#eaeaea'
  },
  loadingText:{
    marginBottom:10,
    textAlign:'center',
    color:'#333'
  },
  closeIcon:{
    position:'absolute',
    width:40,
    height:40,
    fontSize:32,
    right:20,
    top:30,
    color:'#ee735c'
  },
  submitBox:{
    marginTop:50,
    padding:15
  },
  btn:{
    padding:10,
    marginTop:50,
    borderColor:'#ee735c',
    borderWidth:1,
    borderRadius:4,
    color:'#ee735c',
    backgroundColor:'transparent',
    marginLeft:15,
    marginRight:15,
  }

});

module.exports = Edit
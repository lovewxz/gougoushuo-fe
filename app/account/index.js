var React = require('react-native')
var Icon  =  require('react-native-vector-icons/Ionicons')
var ImagePicker = require('react-native-image-picker')
var sha1 = require('sha1')
var Progress = require('react-native-progress')
import Button from 'react-native-button'

var config = require('../common/config')
var request = require('../common/request')


var StyleSheet = React.StyleSheet
var Text = React.Text
var View = React.View
var TabBarIOS = React.TabBarIOS
var TouchableOpacity = React.TouchableOpacity
var Dimensions = React.Dimensions
var Image = React.Image
var AsyncStorage = React.AsyncStorage
var AlertIOS = React.AlertIOS
var Modal = React.Modal
var TextInput = React.TextInput

var width = Dimensions.get('window').width

function avatar(id,type){
  if(id.indexOf('http') > -1){
    return id
  }
  if(id.indexOf('data:image')>-1){
    return id
  }
  return 'http://oenx8uyc8.bkt.clouddn.com/'+id
}
var Account = React.createClass({
    getInitialState(){
      var user = this.props.user || {}
      return {
        user:user,
        avatarProgress:0,
        avatarUploading:false,
        modalVisible:false
      }
    },
    componentDidMount(){
      AsyncStorage.getItem('user')
        .then((data)=>{
          
          var user
          if(data){
            user = JSON.parse(data)
          }
          
          if(user && user.accessToken){
            this.setState({
             
              user:user
            })
          }
        })
    },
    _logout(){
      this.props.logout()
    },
    _showEdit(){
      this.setState({
        modalVisible:true
      })
    },
    _closeModal(){
      this.setState({
        modalVisible:false
      })
    },
    _pickPhoto(){
      var photoOptions = {
        title: '选取头像',
        cancelButtonTitle:'取消',
        takePhotoButtonTitle:'拍照',
        chooseFromLibraryButtonTitle:'从相册选取',
        allowsEditing:true,
        quality:0.75,
        noData:false,
        storageOptions: { 
          skipBackup: true, 
          path: 'images'
        }
      };

      
      ImagePicker.showImagePicker(photoOptions, (response) => {

        if (response.didCancel) {
          return
        }
        var photoData = 'data:image/jpeg;base64,' + response.data
        var uri = response.uri
        var signatureURL = config.api.base+config.api.signature
        var accessToken = this.state.user.accessToken
        request.post(signatureURL,{
          accessToken:accessToken,
          cloud: 'qiniu',
          type:'avatar'
        })
        .then((data)=>{
          if(data && data.success){
            var token = data.data.token
            var key = data.data.key
            var body = new FormData()
            body.append('token',token)
            body.append('key',key)
            body.append('file',{
              type:'image/jpeg',
              uri:uri,
              name:key
            })
            console.log(body)
            this._upload(body)
          }
        })
       
      });

      
    },
    _upload(body){
      var xhr = new XMLHttpRequest()
      var url = config.qiniu.upload
      this.setState({
        avatarUploading:true,
        avatarProgress:0
      })
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
        if(response && response.key){
          var user = this.state.user
          user.avatar = response.key
          this.setState({
            avatarProgress:0,
            avatarUploading:false,
            user:user
          })
          this._asyncUser(true)
        }
      }
      if(xhr.upload){
        xhr.upload.onprogress = (event) => {
          if(event.lengthComputable){
            var percent = Number((event.loaded / event.total).toFixed(2))

            this.setState({
              avatarProgress:percent
            })
          }
        }
      }
      xhr.send(body)
      
    },
    _asyncUser(isAvatar){
      var user = this.state.user
      if(user && user.accessToken){
        var url = config.api.base+config.api.update

        request.post(url,user)
          .then((data)=>{
            if(data && data.success) {
              var user = data.data
              if(isAvatar){
                AlertIOS.alert('头像更新成功')
              }
              this.setState({
                user:user
              },()=>{
                this._closeModal()
                AsyncStorage.setItem('user',JSON.stringify(user))
              })
            }
          })
      }
    },
    _changeUserState(key,value){
      var user = this.state.user
      user[key]= value
      this.setState({
        user : user
      })
    },
    _submit(){
      this._asyncUser()
    },
    render(){
      var user = this.state.user
      return (
        <View style={styles.container}>
          <View style={styles.toolBar}>
             <Text style={styles.toolBarTitle}>
             我的账户</Text>
             <Text style={styles.toolBarEdit} onPress={this._showEdit}>编辑</Text>
          </View>
          {
            user.avatar
            ?<TouchableOpacity style={styles.avatarContainer} onPress={this._pickPhoto}>
              <Image style={styles.avatarContainer} source={{uri:avatar(user.avatar,'image')}} >
                <View style={styles.avatarBox}>
                  {
                    this.state.avatarUploading
                    ?<Progress.Circle 
                      size={75}
                      showsText={true}
                      color={'#ee735c'}
                      progress = {this.state.avatarProgress}/>
                    : <Image
                        source={{uri:avatar(user.avatar,'image')}}
                        style={styles.avatar} />
                  }
                </View>
                <Text style={styles.avatarTip}>戳这里换头像</Text>
              </Image>
            </TouchableOpacity>
            :<TouchableOpacity style={styles.avatarContainer} onPress={this._pickPhoto}>
              <Text style={styles.avatarTip}>添加狗狗头像</Text>
              <View style={styles.avatarBox}>
                {
                  this.state.avatarUploading
                  ?<Progress.Circle 
                    size={75}
                    showsText={true}
                    color={'#ee735c'}
                    progress = {this.state.avatarProgress}/>
                  :<Icon
                    name='ios-cloud-upload-outline'
                    style={styles.plusIcon} />
                }
              </View>
            </TouchableOpacity>
          }
          <Modal
            animated={true}
            visible={this.state.modalVisible}>
            <View style={styles.modalContainer}>
              <Icon
                name='ios-close-outline'
                style={styles.closeIcon} 
                onPress={this._closeModal} />
              <View style={styles.fieldItem}>
                <Text style={styles.label}>昵称</Text>
                <TextInput
                  placeholder={'输入你的昵称'}
                  style={styles.inputField}
                  autoCapitalize={'none'}
                  autoCorrect={false}
                  defaultValue={user.nickname}
                  onChangeText={
                    (text)=>{
                      this._changeUserState('nickname',text)
                    }
                  } />
              </View>
              <View style={styles.fieldItem}>
                <Text style={styles.label}>品种</Text>
                <TextInput
                  placeholder={'输入狗狗的品种'}
                  style={styles.inputField}
                  autoCapitalize={'none'}
                  autoCorrect={false}
                  defaultValue={user.breed}
                  onChangeText={
                    (text)=>{
                      this._changeUserState('breed',text)
                    }
                  } />
              </View>
              <View style={styles.fieldItem}>
                <Text style={styles.label}>年龄</Text>
                <TextInput
                  placeholder={'输入狗狗的年龄'}
                  style={styles.inputField}
                  autoCapitalize={'none'}
                  autoCorrect={false}
                  defaultValue={user.age}
                  onChangeText={
                    (text)=>{
                      this._changeUserState('age',text)
                    }
                  } />
              </View>
              <View style={styles.fieldItem}>
                <Text style={styles.label}>性别</Text>
                <Icon.Button
                  onPress={()=>{
                    this._changeUserState('gender','male')
                  }}
                  style={[
                    styles.gender,
                    user.gender === 'male' && styles.genderChecked
                  ]}
                  name='ios-paw'>男</Icon.Button>
                <Icon.Button
                  onPress={()=>{
                    this._changeUserState('gender','female')
                  }}
                  style={[
                    styles.gender,
                    user.gender === 'female' && styles.genderChecked
                  ]}
                  name='ios-paw-outline'>女</Icon.Button>  
              </View>
              <Button
                style={styles.btn}
                onPress={this._submit}>保存资料</Button>
            </View>
          </Modal>
          <Button
                style={styles.btn}
                onPress={this._logout}>退出登录</Button>
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
  avatarContainer:{
    width:width,
    height:140,
    backgroundColor:'#666',
    alignItems:'center',
    justifyContent:'center',
  },
  avatarBox:{
    marginTop:15,
    alignItems:'center',
    justifyContent:'center'
  },
  plusIcon:{
    padding:20,
    paddingLeft:25,
    paddingRight:25,
    color:'#999',
    fontSize:28,
    backgroundColor:'#fff',
    borderRadius:8
  },
  avatarTip:{
    fontSize:14,
    color:'#fff',
    backgroundColor:'transparent'
  },
  avatar:{
    marginBottom:15,
    width:width*0.2,
    height:width*0.2,
    resizeMode:'cover',
    borderRadius:width*0.1
  },
  toolBarEdit:{
    fontSize:14,
    fontWeight:'600',
    position:'absolute',
    right:10,
    top:25,
    textAlign:'right',
    color:'#fff'
  },
  modalContainer:{
    flex:1,
    paddingTop:50,
    backgroundColor:'#fff'
  },
  fieldItem:{
    flexDirection:'row',
    justifyContent:'space-between',
    alignItems:'center',
    height:50,
    paddingLeft:15,
    paddingRight:15,
    borderColor:'#eee',
    borderBottomWidth:1
  },
  label:{
    color:'#ccc',
    marginRight:10
  },
  inputField:{
    height:50,
    flex:1,
    color:'#666',
    fontSize:14
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
  gender:{
    backgroundColor:'#ccc'
  },
  genderChecked:{
    backgroundColor:'#ee735c'
  },
  btn:{
    padding:10,
    marginTop:20,
    borderColor:'#ee735c',
    borderWidth:1,
    borderRadius:4,
    color:'#ee735c',
    backgroundColor:'transparent',
    marginLeft:15,
    marginRight:15,
  }
 
});

module.exports = Account
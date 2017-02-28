var React = require('react-native')
var Icon  =  require('react-native-vector-icons/Ionicons')
var Video = require('react-native-video').default
//var Button = require('react-native-button')
import Button from 'react-native-button'

var request = require('../common/request')
var config = require('../common/config')
var util = require('../common/util')


var StyleSheet = React.StyleSheet
var Text = React.Text
var View = React.View
var TabBarIOS = React.TabBarIOS
var Dimensions = React.Dimensions
var ActivityIndicatorIOS = React.ActivityIndicatorIOS
var TouchableOpacity = React.TouchableOpacity

var ListView = React.ListView
var Image = React.Image
var TextInput = React.TextInput
var Modal = React.Modal
var AlertIOS = React.AlertIOS
var AsyncStorage = React.AsyncStorage

var width = Dimensions.get('window').width
var cacheDetailResults = {
  nextPage:1,
  items : [],
  total : 0,
}

var Detail = React.createClass({
	getInitialState(){
		var data = this.props.data
    var ds = new ListView.DataSource({
      rowHasChanged: (r1, r2) => r1 !== r2
    });
		return {
			data:data,
      //comments
      dataSource:ds.cloneWithRows([]),
      isLoadingTail:false,
      //modal
      animationType:'none',
      modalVisible:false,
      isSending:false,
      content:'',

      //video loads
			rate:1,
			muted:false,
			resizeMode:'contain',
			repeat:false,
			videoLoaded:false,
			videoProgress:0.01,
			videoTotal:0,
			currentTime:0,
			playing:false,
			videoOk:true
		}
	},
	_pop(){
		this.props.navigator.pop()
    cacheDetailResults = {
      nextPage:1,
      items : [],
      total : 0,
    }
	},
	_onLoadStart(){
		
	},
	_onLoad(){
		
	},
	_onProgress(data){
		
		var duration = data.playableDuration
		var currentTime = data.currentTime
		var percent = Number((currentTime / duration).toFixed(2))
		var newState = {
			videoTotal : duration,
			currentTime : Number(currentTime.toFixed(2)),
			videoProgress:percent
		}
		if(!this.state.videoLoaded){
			newState.videoLoaded = true
		}
		if(!this.state.playing){
			newState.playing = true
		}
		this.setState(newState)
	},
	_onEnd(){
		this.setState({
			videoProgress : 1,
			playing : false
		})
		
	},
	_onError(e){
		this.setState({
			videoOk:false
		})
	
	},
	_replay(){
		this.refs.videoPlayer.seek(0)
	},
	_paused(){
		if(!this.state.paused){
			this.setState({
				paused:true
			})
		}
	},
	_resume(){
		if(this.state.paused){
			this.setState({
				paused:false
			})
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
          },()=> this._fetchData(1))
        }
      })
  },
  _fetchData(page){
    
    this.setState({
      isLoadingTail:true
    })
   
    
    request.get(config.api.base+config.api.comment,{
        accessToken:this.state.user.accessToken,
        page:page,
        creative:this.state.data._id
      })
      .then((data) => {
        if(data && data.success){
            console.log(data);
          if(data.data.length > 0){

            var items = cacheDetailResults.items.slice()
            items = items.concat(data.data)
            cacheDetailResults.nextPage += 1
            cacheDetailResults.items = items
            cacheDetailResults.total = data.total
            
            this.setState({
              dataSource:this.state.dataSource.cloneWithRows(cacheDetailResults.items),
              isLoadingTail:false
            })
          }

        }
        
      })
      .catch((error) => {
        
        this.setState({
          isLoadingTail:false
        })
        console.warn(error);
      });
  },
  _hasMore(){
    return cacheDetailResults.items.length !== cacheDetailResults.total
  },
  _fetchMoreData(){
    if(!this._hasMore() || this.state.isLoadingTail){
      return 
    }
    var page = cacheDetailResults.nextPage
    this._fetchData(page)
  },
  _renderFooter(){
    if(!this._hasMore() && cacheDetailResults.total !==0){
      return (
        <View style={styles.loadingMore}>
          <Text style={styles.loadingText}>没有更多了</Text> 
        </View>
      )
    }
    if(!this._hasMore() && cacheDetailResults.total === 0){
      return (
        <View style={styles.loadingMore}>
          <Text style={styles.loadingText}>赶快评论一个吧！</Text> 
        </View>
      )
    }
    if(!this.state.isLoadingTail){
      return <View style={styles.loadingMore} />
    }
    return (
          <ActivityIndicatorIOS
            style={styles.loadingMore}/>
      );
  },
  _renderRow(row){
    return(
      <View key={row.id} style={styles.replyBox}>
        <Image style={styles.replyAvatar} source={{uri:util.avatar(row.replyBy.avatar)}} />
        <View style={styles.reply}>
          <Text style={styles.replyNickname}>{row.replyBy.nickname}</Text>
          <Text style={styles.replyContent}>{row.content}</Text>
        </View>
      </View>
    )
  },
  _focus(){
    this._setModalVisible(true)
  },
  _blur(){

  },
  _closeModal(){
    this._setModalVisible(false)
  },
  _setModalVisible(isVisible){
    this.setState({
      modalVisible:isVisible
    })
  },
  _submit(){
    var that = this
    if(!this.state.content){
      return AlertIOS.alert('留言不能为空')
    }
    if(this.state.isSending){
      return AlertIOS.alert('正在评论中...')
    }
    this.setState({
      isSending:true
    },function(){
      var body={
        accessToken:this.state.user.accessToken,
        comment:{
          creative:this.state.data._id,
          content:this.state.content
        }
      }
      var url = config.api.base+config.api.comment
      request.post(url,body)
        .then(function(data){
          if(data && data.success){

            var items = cacheDetailResults.items.slice()
            var content = that.state.content
            items=data.data.concat(items)
            cacheDetailResults.items = items
            cacheDetailResults.total = cacheDetailResults.total + 1

            console.log(cacheDetailResults);
            that.setState({
              content:'',
              isSending:false,
              dataSource:that.state.dataSource.cloneWithRows(cacheDetailResults.items)
            })
            that._setModalVisible(false)
          }
        })
        .catch((err)=>{
          console.log(err)
          that.setState({
            isSending:false
          })
          that._setModalVisible(false)
          AlertIOS.alert('留言失败，请重试！')
        })
    })
  },
  _renderHeader(){
    var data = this.state.data
    return (
    <View style={styles.listHeader}>
      <View style={styles.infoBox}>
        <Image style={styles.avatar} source={{uri:util.avatar(data.author.avatar)}} />
        <View style={styles.descBox}>
          <Text style={styles.nickname}>{data.author.nickname}</Text>
          <Text style={styles.title}>{data.title}</Text>
        </View>
      </View>
      <View style={styles.commentBox}>
        <View style={styles.comment}>
          <TextInput
            placeholder="敢不敢评论一个"
            style={styles.content}
            multiline={true} 
            onFocus={this._focus} />
        </View>
      </View>
      <View style={styles.commentArea}>
        <Text style={styles.commentTitle}>精彩评论</Text>
      </View>
    </View>
    )
  },
  render(){
    var data = this.props.data
    
    return (

      <View style={styles.container}>
        <View style={styles.header}>
        	<TouchableOpacity style={styles.backBox} onPress={this._pop}>
        		<Icon name='ios-arrow-back' style={styles.backIcon} />
        		<Text style={styles.backText}>返回</Text>
        	</TouchableOpacity>
        	<Text style={styles.headerTitle} numberOflines={1}>视频详情页</Text>
        </View>
        <View style={styles.videoBox}>
        	<Video
        		ref='videoPlayer'
        		style={styles.video}
        		source={{uri:util.video(data.qiniu_video)}}
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
        			!this.state.videoLoaded &&  <ActivityIndicatorIOS
	       			 style={styles.loading} color='#ee735c'/>		
        		}
        		{
        			!this.state.videoOk && <Text style={styles.failedText}>视频出错了,请稍后重试</Text>
        		}
        		{
        			this.state.videoLoaded && !this.state.playing
        			? <Icon
        				style={styles.playIcon}
        				name='ios-play'
      					size={40} 
      					onPress={this._replay} />
        			: null
        		}
        		{
        			this.state.videoLoaded && this.state.playing
        			?<TouchableOpacity style={styles.pausedBtn} onPress={this._paused}>
        				{
          				this.state.paused
          				?<Icon style={styles.resume} onPress={this._resume} name="ios-play" size={40} />
          				:<Text></Text>
        				}
        			</TouchableOpacity>
        			:null
        		}
        		<View style={styles.progressBox}>
        			<View style={[styles.progressBar,{width:width*this.state.videoProgress}]}>
        			</View>

        		</View>
        </View>
          <ListView 
            dataSource={this.state.dataSource}
            renderRow={this._renderRow}
            renderHeader = {this._renderHeader} 
            renderFooter = {this._renderFooter} 
            automaticallyAdjustContentInsets={false} 
            onEndReached = {this._fetchMoreData}
            onEndReachedThreshold={20} 
            showsVerticalScrollIndicator={false} />
            <Modal
              animationType={'fade'}
              visible={this.state.modalVisible}
              onRequestClose={()=>{this._setModalVisible(false)}}>
              <View style={styles.modalContainer}>
                <Icon
                  onPress={this._closeModal}
                  name='ios-close-outline'
                  style={styles.closeIcon} />
                <View style={styles.commentBox}>
                  <View style={styles.comment}>
                    <TextInput
                      placeholder="敢不敢评论一个"
                      style={styles.content}
                      multiline={true} 
                      onFocus={this._focus} 
                      onBlur={this._blur}
                      defaultValue={this.state.content}
                      onChangeText={(text)=>{
                        this.setState({
                          content:text
                        })
                      }} />
                  </View>
                </View>
                <Button style={styles.submitBtn} onPress={this._submit}>评论</Button>
              </View>
            </Modal>
      </View>


    )
  }
})


const styles = StyleSheet.create({
  container: {
    flex: 1,
   
    backgroundColor: '#F5FCFF',
  },
  modalContainer:{
    flex:1,
    paddingTop:45,
    backgroundColor:'#fff'
  },
  closeIcon:{
    alignSelf:'center',
    fontSize:30,
    color:'#ee735c'
  },
  submitBtn:{
    width:width-20,
    padding:16,
    marginTop:20,
    marginBottom:20,
    borderWidth:1,
    borderColor:'#ee735c',
    borderRadius:4,
    color:'#ee735c',
    fontSize:18
  },
  header:{
  	flexDirection:'row',
  	justifyContent:'center',
  	alignItems:'center',
  	width:width,
  	height:64,
  	paddingTop:20,
  	paddingLeft:10,
  	paddingRight:10,
  	borderBottomWidth:1,
  	borderColor:'rgba(0,0,0,0.1)',
  	backgroundColor:'#fff'
  },
  backBox:{
  	position:'absolute',
  	left:12,
  	top:32,
  	width:50,
  	flexDirection:'row',
  	alignItems:'center'	
  },
  headerTitle:{
  	width:width-120,
  	textAlign:'center',

  },
  backIcon:{
  	color:'#999',
  	fontSize:20,
  	marginRight:5
  },
  backText:{
  	color:'#999'
  },
  videoBox:{
 	width:width,
 	height:width*0.56,
 	backgroundColor:'#000' 	
  },
  video:{
  	width:width,
  	height:width*0.56,
  	backgroundColor:'#000'
  },
  loading:{
  	position:'absolute',
  	left:0,
  	top:90,
  	width:width,
  	alignSelf:'center',
  	backgroundColor:'transparent'
  },
  failedText:{
  	position:'absolute',
  	left:0,
  	top:80,
  	width:width,
  	textAlign:'center',
  	backgroundColor:'transparent',
  	color:'#fff'
  },
  progressBox:{
  	width:width,
  	height:1,
  	backgroundColor:"#ccc"
  },
  progressBar:{
  	width:1,
  	height:2,
  	backgroundColor:"#ff6600"
  },
  playIcon:{
  	position:'absolute',
  	top:90,
  	left:width / 2-30,
  	width:60,
  	height:60,
  	paddingTop:9,
  	paddingLeft:22,
  	backgroundColor:'transparent',
  	borderColor:'#fff',
  	borderWidth:1,
  	borderRadius:30,
  	color:'#ed7b66'
  },
  pausedBtn:{
  	width:width,
  	height:360,
  	position:'absolute',
  	left:0,
  	top:0,

  },
  resume:{
  	position:'absolute',
  	top:90,
  	left:width / 2-30,
  	width:60,
  	height:60,
  	paddingTop:9,
  	paddingLeft:22,
  	backgroundColor:'transparent',
  	borderColor:'#fff',
  	borderWidth:1,
  	borderRadius:30,
  	color:'#ed7b66'
  },
  infoBox:{
    width:width,
    flexDirection:'row',
    justifyContent:'center',
    marginTop:10
  },
  avatar:{
    width:60,
    height:60,
    marginRight:10,
    marginLeft:10,
    borderRadius:30
  },
  descBox:{
    flex:1
  },
  nickname:{
    fontSize:18
  },
  title:{
    marginTop:8,
    fontSize:16,
    color:'#666'
  },
  replyBox:{
    flexDirection:'row',
    justifyContent:'flex-start',
    marginTop:10
  },
  replyAvatar:{
    width:40,
    height:40,
    marginRight:10,
    marginLeft:10,
    borderRadius:20
  },
  replyNickname:{
    color:'#666'
  },
  replyContent:{
    marginTop:4,
    color:'#666'
  },
  reply:{
    flex:1
  },
  loadingMore:{
    marginVertical:20
  },
  loadingText:{
    color:'#777',
    textAlign:'center'
  },
  listHeader:{
    marginTop:10,
    width:width
  },
  commentBox:{
    marginTop:10,
    marginBottom:10,
    padding:8,
    width:width
  },
  content:{
    paddingLeft:2,
    color:"#333",
    borderWidth:1,
    borderColor:'#ddd',
    borderRadius:4,
    fontSize:14,
    height:80
  },
  commentArea:{
    width:width,
    paddingBottom:6,
    paddingLeft:10,
    paddingRight:10,
    borderBottomWidth:1,
    borderBottomColor:'#eee',

  }

});

module.exports = Detail
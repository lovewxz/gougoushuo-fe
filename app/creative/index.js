var React = require('react-native')
var Icon  =  require('react-native-vector-icons/Ionicons')


var request = require('../common/request')
var config = require('../common/config')
var Detail = require('./detail')
var util = require('../common/util')

var StyleSheet = React.StyleSheet
var Text = React.Text
var View = React.View
var TabBarIOS = React.TabBarIOS
var ListView = React.ListView
var TouchableHighlight = React.TouchableHighlight
var Image = React.Image
var Dimensions = React.Dimensions
var ActivityIndicatorIOS = React.ActivityIndicatorIOS
var RefreshControl = React.RefreshControl
var AlertIOS = React.AlertIOS
var AsyncStorage = React.AsyncStorage

var width = Dimensions.get('window').width
var cacheResults = {
	nextPage:1,
	items : [],
	total : 0,
}

var Item = React.createClass({
	getInitialState(){
		var row = this.props.row

		return {
			up:row.voted,
			row: row	
		}
	},
	_up(){
		var up = !this.state.up
		var url = config.api.base+config.api.up
		var row = this.state.row
		
		var body ={
			_id:row._id,
			up:up ? true : false,
			accessToken:this.props.user.accessToken
		}

		var that = this
		request.post(url,body)
			   .then(function(data){
			   	
			   		if(data && data.success){
			   			that.setState({
			   				up:up
			   			})
			   		}else{
			   			AlertIOS.alert('点赞失败，请稍后再试')
			   		}
			   })
			   .catch(function(err){
			   	 console.log(err)
			   	 AlertIOS.alert('点赞失败，请稍后再试')
			   })
	},
	render(){
		var row = this.state.row
		return (
			<TouchableHighlight onPress={this.props.onSelect}>
					<View style={styles.item}>
						<Text style={styles.title}>{row.title}</Text>
						<Image
							source = {{uri:util.thumb(row.qiniu_thumb)}}
							style ={styles.thumb}
						>
							<Icon
								name='ios-play'
								size={28}
								style={styles.play}	/>
						</Image>
						<View style={styles.itemFooter}>
							<View style={styles.handleBox}>
								<Icon
									name={this.state.up?'ios-heart':'ios-heart-outline'}
									size={28}
									style={[styles.up,this.state.up ? null : styles.down]} 
									onPress={this._up}/>
								<Text style={styles.handleText} onPress={this._up}>喜欢</Text>
							</View>
							<View style={styles.handleBox}>
								<Icon
									name='ios-chatboxes-outline'
									size={28}
									style={styles.commentIcon} />
								<Text style={styles.handleText}>评论</Text>
							</View>
						</View>
					</View>
			</TouchableHighlight>
		)
	}
})
var List = React.createClass({
	getInitialState() {
	  var ds = new ListView.DataSource({
	  	rowHasChanged: (r1, r2) => r1 !== r2
	  });

	  return {
	    dataSource: ds.cloneWithRows([]),
	    isLoadingTail:false,
	    isRefreshing:false
	  };
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
		if(page !== 0 ){
			this.setState({
				isLoadingTail:true
			})
		}else{
			this.setState({
				isRefreshing:true
			})
		}
		var user = this.state.user
		request.get(config.api.base+config.api.creative,{
				accessToken:user.accessToken,
				page:page
			})

		  .then((data) => {
		  	if(data && data.success){
		  		console.log(data);
		  		if(data.data.length > 0){

		  			data.data.map((item)=>{
		  				var votes = item.votes || []

		  				if(votes.indexOf(user._id) > -1){
		  					item.voted = true
		  				}else{
		  					item.voted = false
		  				}
		  			})
		  			var items = cacheResults.items.slice()
			  		if(page !== 0){
			  			items = items.concat(data.data)
			  			cacheResults.nextPage += 1
			  		}else{
			  			items = data.data.concat(items)
			  		}
			  		
			  		cacheResults.items = items
			  		cacheResults.total = data.total
			  		if(page !== 0) {
			  			this.setState({
				  			dataSource:this.state.dataSource.cloneWithRows(cacheResults.items),
				  			isLoadingTail:false
			  			})
			  		}else{
			  			this.setState({
				  			dataSource:this.state.dataSource.cloneWithRows(cacheResults.items),
				  			isRefreshing:false
			  			})
			  		}
		  		}
		  	}
		    
		  })
		  .catch((error) => {
		  	if(page !== 0){
		  		this.setState({
		  			isLoadingTail:false
		  		})
		  	}else{
		  		this.setState({
		  			isRefreshing:false
		  		})
		  	}
		    
		  });
	},
	_renderRow(row){
		return (
			<Item key={row._id}
				onSelect={()=>this._loadPage(row)}
			 	row={row}
			 	user = {this.state.user} 
			 />
		)
	},
	_hasMore(){
		
		return cacheResults.items.length !== cacheResults.total
	},
	_fetchMoreData(){
		if(!this._hasMore() || this.state.isLoadingTail){
			return 
		}
		var page = cacheResults.nextPage
		this._fetchData(page)
	},
	_renderFooter(){
		if(!this._hasMore() && cacheResults.total !==0){
			return (
				<View style={styles.loadingMore}>
					<Text style={styles.loadingText}>没有更多了</Text>	
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
	_onRefresh(){
		
		if(!this._hasMore() || this.state.isRefreshing){

			return 
		}

		this._fetchData(0)
	},
	_loadPage(row){
		this.props.navigator.push({
			name:'detail',
			component:Detail,
			params:{
				data:row
			}
		})
	},
    render(){
      return (
        <View style={styles.container}>
        	<View style={styles.head}>
        		<Text style={styles.headTitle}>列表页</Text>
        	</View>
        	<ListView 
        		dataSource={this.state.dataSource}
        		renderRow={this._renderRow}
        		renderFooter = {this._renderFooter} 
        		automaticallyAdjustContentInsets={false} 
        		onEndReached = {this._fetchMoreData}
        		onEndReachedThreshold={20} 
        		showsVerticalScrollIndicator={false}
        		refreshControl={
			          <RefreshControl
			            refreshing={this.state.isRefreshing}
			            onRefresh={this._onRefresh}
			            tintColor="#ff0000"
			            title="拼命加载中..." />  
			            
        		}

          		enableEmptySections={true}
        		 />
        </View>
      )
    }
})


const styles = StyleSheet.create({
  container: {
    flex: 1,
    
    backgroundColor: '#F5FCFF',
  },
  head:{
  	paddingTop:25,
  	paddingBottom:12,
  	backgroundColor:'#ee735c'
  },
  headTitle:{
  	fontSize:16,
  	color:'#fff',
  	textAlign:'center',
  	fontWeight:'600'
  },
  item:{
  	marginBottom:10,
  	backgroundColor:'#fff',
  },
  thumb:{
  	width:width,
  	height:width*0.56,
  	resizeMode:'cover'
  },
  title:{
  	padding:10,
  	fontSize:18,
  	color:"#333"
  },
  itemFooter:{
  	flexDirection:'row',
  	justifyContent:'space-between',
  	backgroundColor:'#eee'
  },
  handleBox:{
  	padding:10,
  	flexDirection:'row',
  	width:width/2 - 0.5,
  	justifyContent:'center',
  	backgroundColor:'#fff'
  },
  play:{
  	position:'absolute',
  	bottom:14,
  	right:14,
  	width:46,
  	height:46,
  	paddingTop:9,
  	paddingLeft:18,
  	backgroundColor:'transparent',
  	borderColor:'#fff',
  	borderWidth:1,
  	borderRadius:23,
  	color:'#ed7b66'
  },
  handleText:{
  	paddingLeft:12,
  	fontSize:18,
  	color:'#333'
  },
  up:{
  	fontSize:22,
  	color:'#ed7b66'	
  },
  down:{
  	fontSize:22,
  	color:'#333'	
  },
  commentIcon:{
  	fontSize:22,
  	color:'#333'
  },
  loadingMore:{
  	marginVertical:20
  },
  loadingText:{
  	color:'#777',
  	textAlign:'center'
  }

});

module.exports = List
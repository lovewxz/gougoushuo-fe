var React = require('react-native')
var Icon  =  require('react-native-vector-icons/Ionicons')
import Button from 'react-native-button'
var CountDown = require('react-native-sk-countdown').CountDownText

var request = require('../common/request')
var config = require('../common/config')

var StyleSheet = React.StyleSheet
var Text = React.Text
var View = React.View
var TabBarIOS = React.TabBarIOS
var TextInput = React.TextInput
var AlertIOS = React.AlertIOS


var Login = React.createClass({
	getInitialState(){
		return {
			verifyCode:'',
			phoneNumber:'',
			codeSent:false,
			countingDone:false
		}
	},
	_showVerifyCode(){
		this.setState({
			codeSent:true,
		})
	},
	_countingDown(){
		this.setState({
			countingDone:true
		})
	},
	_sendVerifyCode(){
    this.setState({
      countingDone:false
    })
		var phoneNumber = this.state.phoneNumber
		if(!phoneNumber){
			return AlertIOS.alert('手机号不能为空')
		}
		var body={
			phoneNumber:phoneNumber
		}
		var singupURL = config.api.base+config.api.signup
		
		request.post(singupURL,body)
			.then((data)=>{
				
				if(data && data.success){
					this._showVerifyCode()
				}else{
					AlertIOS.alert('获取验证码失败，请检查手机号是否正确')
				}
			})
			.catch((err)=>{
				AlertIOS.alert('获取验证码失败，请检查网络是否良好')
			})
	},
  _submit(){
    var phoneNumber = this.state.phoneNumber
    var verifyCode = this.state.verifyCode
    if(!phoneNumber || !verifyCode){
      return AlertIOS.alert('手机号或验证码不能为空')
    }
    var body={
      phoneNumber:phoneNumber,
      verifyCode:verifyCode
    }
    var loginURL = config.api.base+config.api.verify
    
    request.post(loginURL,body)
      .then((data)=>{
        
        if(data && data.success){
          this.props.afterLogin(data.data)
        }else{
          AlertIOS.alert('登录失败，请检查手机号是否正确')
        }
      })
      .catch((err)=>{
        AlertIOS.alert('登录失败，请检查网络是否良好')
      })
  },
    render(){
      return (
        <View style={styles.container}>
          <View style={styles.singupBox}>
          	<Text style={styles.title}>快速登录</Text>
          	<TextInput
          		placeholder='输入手机号'
          		autoCaptialize={'none'}
          		autoCorrect={false}
          		keyboardType={'number-pad'}
          		style={styles.inputField}
          		onChangeText={(text)=>{
          			this.setState({
          				phoneNumber:text
          			})
          		}} />
          	{
          		this.state.codeSent
          		?<View style={styles.verifyCodeBox}>
          			<TextInput
		          		placeholder='输入验证码'
		          		autoCaptialize={'none'}
		          		autoCorrect={false}
		          		keyboardType={'number-pad'}
		          		style={styles.inputField}
		          		onChangeText={(text)=>{
		          			this.setState({
		          				verifyCode:text
		          			})
		          		}} />
		          		{
		          			 this.state.countingDone
		          			 ?<Button
		          			 	style={styles.verifyBtn}
		          			 	onPress={this._sendVerifyCode}>重新获取
		          			  </Button>
		          			 : <CountDown
					            style={styles.verifyBtn}
					            countType='seconds' // 计时类型：seconds / date
					            auto={true} // 自动开始
					            afterEnd={this._countingDown} // 结束回调
					            timeLeft={60} // 正向计时 时间起点为0秒
					            step={-1} // 计时步长，以秒为单位，正数则为正计时，负数为倒计时
					            startText='获取验证码' // 开始的文本
					            endText='获取验证码' // 结束的文本
					            intervalText={(sec) => sec + '秒重新获取'} />
		          		}
          		</View>
          		:null
          	}
          	{
          		this.state.codeSent
          		?<Button
          			style={styles.btn}
          			onPress={this._submit}>登录</Button>
          		:<Button
          			style={styles.btn}
          			onPress={this._sendVerifyCode}>获取验证码</Button>
          	}
          </View>
        </View>
      )
    }
})


const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding:10,
    backgroundColor: '#f9f9f9',
  },
  singupBox:{
  	marginTop:30,
  },
  title:{
  	marginBottom:20,
  	color:'#333',
  	fontSize:20,
  	textAlign:'center'
  },
  inputField:{
  	flex:1,
  	height:40,
  	padding:5,
  	color:'#666',
  	fontSize:16,
  	backgroundColor:'#fff',
  	borderRadius:4
  },
  verifyCodeBox:{
  	marginTop:10,
  	flexDirection:'row',
  	justifyContent:'space-between'
  },
  verifyBtn:{
  	width:120,
  	height:40,
  	padding:10,
  	marginLeft:8,
  	backgroundColor:'#ee735c',
  	borderColor:'#ee735c',
  	textAlign:'center',
  	fontWeight:'600',
  	color:'#fff',
  	fontSize:15,
  	borderRadius:2
  },
  btn:{
  	padding:10,
  	marginTop:10,
  	borderColor:'#ee735c',
  	borderWidth:1,
  	borderRadius:4,
  	color:'#ee735c',
  	backgroundColor:'transparent'
  }






  
});

module.exports = Login
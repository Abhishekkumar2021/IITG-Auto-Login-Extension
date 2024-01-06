/**
 Background when starts checks if the state is autologin
 if state == autologin, it starts the Autologin Interval
 It also observes for the changes in state, changes Autologin on off accordingly
 */

const urlLogin = "https://agnigarh.iitg.ac.in:1442/login?"

let userName = localStorage['username']
let password = localStorage['password']

const LOGGED_OUT_STATE = "logged_out"
const AUTOLOGIN_STATE = "autologin"
const NO_CREDS_STATE = "no_creads_state"

async function ActionLogin() {
	try {
		const response = await fetch(urlLogin);
		const html = await response.text();
		let parser = new DOMParser();
		let doc = parser.parseFromString(html, 'text/html');
		let magic_input_value = doc.querySelector('input[name="magic"]').value;
		console.log('magic :', magic_input_value);

		const params = new URLSearchParams();
		params.append('magic', magic_input_value);
		params.append('4Tredir', "https://agnigarh.iitg.ac.in:1442/login?")
		params.append('username', userName)
		params.append('password', password)

		const postResponse = await fetch(urlLogin, {
			method: 'POST',
			body: params,
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded'
			}
		});
		console.log('Status ', postResponse.status)
		const postData = await postResponse.text();
		console.log(postData);
		//get keepalive
		const keepAliveValue = postData.match(/(?<=keepalive\?)[a-zA-Z\d]+/gm)[0];
		if (keepAliveValue == undefined) throw 'NoKeepAliveValueFound'
		console.log('KeepAlive Value', keepAliveValue);
		localStorage['session-code'] = keepAliveValue

	} catch (error) {
		console.error(`Error: ${error}`)
		if (error == 'NoKeepAliveValueFound') {
			console.log('May be wrong credentials')
		}

	}
}

console.log('Hello, running in background')

let intervalId = null;

function StartAutologin() {
	if (intervalId) EndAutoLogin()
	ActionLogin().then().catch()
	intervalId = setInterval(() => {
		// Your code to run every 5 minutes goes here
		ActionLogin().then().catch()
		console.log('Executing every 5 minutes...');
	}, 5 * 60 * 1000); // 5 minutes in milliseconds
}

function EndAutoLogin() {
	if (intervalId) {
		console.log('Interval deactivated');
		clearInterval(intervalId);
		intervalId = null;
	} else {
		console.log('Interval is not active');
	}
}


if (localStorage['state'] == AUTOLOGIN_STATE) StartAutologin()

function HandleStorageChange(event) {
	if (localStorage['state'] == AUTOLOGIN_STATE) {
		StartAutologin()
	} else EndAutoLogin()
}

window.addEventListener('storage', HandleStorageChange)
//
//chrome.storage.onChanged
//	.addListener((changes, namespace) => {
//		let autoLoginEnabled = false
//		for (let key in changes) {
//			let storageChange = changes[key]
//			if (key == 'state' && storageChange.newValue == AUTOLOGIN_STATE) {
//				autoLoginEnabled = true
//				break
//			}
//		}
//		if (autoLoginEnabled) {
//			StartAutologin()
//			password = localStorage['password']
//			userName = localStorage['username']
//			console.log('creds fetched are', userName, password)
//		} else {
//			EndAutoLogin()
//		}
//	})
//


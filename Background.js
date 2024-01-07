/**
 Background when starts checks if the state is autologin
 if state == autologin, it starts the Autologin Interval
 It also observes for the changes in state, changes Autologin on off accordingly
 */

console.log('Hi, service worker started')


const urlLogin = "https://agnigarh.iitg.ac.in:1442/login?"

const LOGGED_OUT_STATE = "logged_out"
const AUTOLOGIN_STATE = "autologin"
const NO_CREDS_STATE = "no_creads_state"

async function ActionLogin() {
	try {

		const encryptedData = await GetData('data');

		if (!encryptedData) {
			console.log("User cred not found");
			return;
		}

		const decryptedData = await decrypt(encryptedData, key);

		let userName = decryptedData.email;
		let password = decryptedData.password;

		// console.log({userName, password});

		const response = await fetch(urlLogin);
		const html = await response.text();
//		let parser = new DOMParser();
//		let doc = parser.parseFromString(html, 'text/html');
//		let magic_input_value = doc.querySelector('input[name="magic"]').value;
		const magic_input_value = html.match(/(?<=name="magic" value=")[a-zA-Z\d]+/gm)[0]
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
//		localStorage['session-code'] = keepAliveValue
		chrome.storage.local.set({'session-code': keepAliveValue})
		chrome.action.setIcon({path: 'Icons/icon_active2.png'})

	} catch (error) {
		console.log(`Error: ${error}`)
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


//if (localStorage['state'] == AUTOLOGIN_STATE) StartAutologin()
GetData('state').then((data) => {
	if (data == AUTOLOGIN_STATE) StartAutologin()
})

chrome.storage.onChanged.addListener((changes, namespace) => {
	if ('data' in changes || 'state' in changes)
		GetData('state').then((data) => {
			if (data == AUTOLOGIN_STATE) StartAutologin()
		})
});

//function HandleStorageChange(event) {
//	if (localStorage['state'] == AUTOLOGIN_STATE) {
//		StartAutologin()
//	} else EndAutoLogin()
//}
//
//window.addEventListener('storage', HandleStorageChange)
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


//UTILS 
const key = "zPL+=kHBbkUOM7$M!N@idDS9xs+ike@h"

async function encrypt(email, password, securityKey) {
	const dataToEncrypt = {email, password};


	const jsonString = JSON.stringify(dataToEncrypt);


	const encoder = new TextEncoder();
	const dataToEncryptUint8 = encoder.encode(jsonString);


	const keyMaterial = await crypto.subtle.importKey(
		'raw',
		encoder.encode(securityKey),
		{name: 'PBKDF2'},
		false,
		['deriveBits', 'deriveKey']
	);

	const derivedKey = await crypto.subtle.deriveKey(
		{
			name: 'PBKDF2',
			salt: new Uint8Array(16),
			iterations: 100000,
			hash: 'SHA-256',
		},
		keyMaterial,
		{name: 'AES-GCM', length: 256},
		true,
		['encrypt', 'decrypt']
	);


	const iv = crypto.getRandomValues(new Uint8Array(12));
	const encryptedData = await crypto.subtle.encrypt(
		{name: 'AES-GCM', iv: iv},
		derivedKey,
		dataToEncryptUint8
	);

	const encryptedString = Array.from(iv)
		.concat(Array.from(new Uint8Array(encryptedData)))
		.map(byte => byte.toString(16).padStart(2, '0'))
		.join('');

	return encryptedString;
}

async function decrypt(encryptedString, securityKey) {

	const decoder = new TextDecoder('utf-8');
	const encryptedData = new Uint8Array(
		encryptedString.match(/.{1,2}/g).map(byte => parseInt(byte, 16))
	);


	const keyMaterial = await crypto.subtle.importKey(
		'raw',
		new TextEncoder().encode(securityKey),
		{name: 'PBKDF2'},
		false,
		['deriveBits', 'deriveKey']
	);

	const derivedKey = await crypto.subtle.deriveKey(
		{
			name: 'PBKDF2',
			salt: new Uint8Array(16),
			iterations: 100000,
			hash: 'SHA-256',
		},
		keyMaterial,
		{name: 'AES-GCM', length: 256},
		true,
		['encrypt', 'decrypt']
	);


	const iv = encryptedData.slice(0, 12);


	const decryptedData = await crypto.subtle.decrypt(
		{name: 'AES-GCM', iv: iv},
		derivedKey,
		encryptedData.slice(12)
	);


	const decryptedString = decoder.decode(new Uint8Array(decryptedData));


	const decryptedObject = JSON.parse(decryptedString);

	return decryptedObject;
}

async function GetData(key) {
	return new Promise((resolve, reject) => {
		chrome.storage.local.get([key], (res) => {
			resolve(res[key])
		})
	})
}



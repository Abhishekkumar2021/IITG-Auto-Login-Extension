/**
 Background when starts checks if the state is autologin
 if state == autologin, it starts the Autologin Interval
 It also observes for the changes in state, changes Autologin on off accordingly
 */

//Keep this listener at the top only :https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/events
chrome.storage.onChanged.addListener((changes, namespace) => {
	if ('data' in changes || 'state' in changes)
		GetData('state').then((data) => {
			if (data == AUTOLOGIN_STATE) StartAutologin()
			if (data == LOGGED_OUT_STATE) EndAutoLogin()
		})
});

async function createOffscreen() {
	await chrome.offscreen.createDocument({
		url: 'offscreen.html',
		reasons: ['BLOBS'],
		justification: 'Needs for refreshing and checking network',
	}).catch(() => {
	});
}

chrome.runtime.onStartup.addListener(createOffscreen);
self.onmessage = e => {
	logger('Hi message received', e)
}; // keepAlive
createOffscreen();


logger('Hi, service worker started')


const urlLogin = "https://agnigarh.iitg.ac.in:1442/login?"

const LOGGED_OUT_STATE = "logged_out"
const AUTOLOGIN_STATE = "autologin"
const NO_CREDS_STATE = "no_creads_state"

let sessionCode = undefined

async function ActionLogin() {
	try {

		const encryptedData = await GetData('data');

		if (!encryptedData) {
			logger("User cred not found");
			return;
		}

		const decryptedData = await decrypt(encryptedData, key);

		let userName = decryptedData.email;
		let password = decryptedData.password;

		// logger({userName, password});

		const response = await fetch(urlLogin);
		const html = await response.text();
//		let parser = new DOMParser();
//		let doc = parser.parseFromString(html, 'text/html');
//		let magic_input_value = doc.querySelector('input[name="magic"]').value;
		const magic_input_value = html.match(/(?<=name="magic" value=")[a-zA-Z\d]+/gm)[0]
		logger('magic :', magic_input_value);

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


		logger('Status ', postResponse.status)
		const postData = await postResponse.text();
		logger(postData);
		if (postData.includes('Firewall authentication failed')) {
			logger('Wrong Credentials')
			chrome.storage.local.set({status: 10, status_text: 'Wrong Credentials'})
			EndAutoLogin()
		} else {
			chrome.storage.local.set({status: 9, status_text: 'Auto Login Active'})
		}
		//get keepalive
//		sessionCode = postData.match(/(?<=keepalive\?)[a-zA-Z\d]+/gm)[0];
//		if (sessionCode == undefined) throw 'NoKeepAliveValueFound'
//		logger('KeepAlive Value', sessionCode);
//		localStorage['session-code'] = keepAliveValue
//		chrome.storage.local.set({'session-code': sessionCode})
		chrome.action.setIcon({path: 'Icons/icon_active2.png'})

	} catch (error) {
		logger(`Error: ${error}`)
//		if (error == 'NoKeepAliveValueFound') {
//			logger('May be wrong credentials')
//		}
		chrome.action.setIcon({path: 'Icons/icon_logged_out.png'})

	}
}


//if (localStorage['state'] == AUTOLOGIN_STATE) StartAutologin()
GetData('state').then((data) => {
	if (data == AUTOLOGIN_STATE) StartAutologin()
})


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
//			logger('creds fetched are', userName, password)
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

function logger(...text) {
	console.log(...text)
}



/**
 Background when starts checks if the state is autologin
 if state == autologin, it starts the Autologin Interval
 It also observes for the changes in state, changes Autologin on off accordingly
 */
const LOGGED_OUT_STATE = "logged_out"
const AUTOLOGIN_STATE = "autologin"
const NO_CREDS_STATE = "no_creads_state"


chrome.storage.onChanged.addListener((changes, namespace) => {
	if ('data' in changes || 'state' in changes) {
		init()
	}
});
chrome.runtime.onStartup.addListener(
	() => {
		logger('browser started, starting offscreen')
		init()
	})
chrome.runtime.onInstalled.addListener(
	() => {
		chrome.runtime.openOptionsPage()
	}
)
chrome.runtime.onMessage.addListener(
	(message) => {
		if (message.title == 'refresh') {
			ActionLogin().catch()
		}
	}
)
init()

function init() {
	GetData('state').then(async (data) => {
		await setupOffscreenDocument('offscreen.html').catch((e) => {
			logger('Error on setting offscreen ', e)
		})

		if (data == AUTOLOGIN_STATE) {
			chrome.runtime.sendMessage({
				title: 'login_actions',
				action: 'start_auto_login'
			})
		} else if (data == LOGGED_OUT_STATE) {
			chrome.runtime.sendMessage({
				title: 'login_actions',
				action: 'end_auto_login'
			})
		}
		//			if (data == AUTOLOGIN_STATE) StartAutologin()
		//			if (data == LOGGED_OUT_STATE) EndAutoLogin()
	})
}


let creating; // A global promise to avoid concurrency issues
async function setupOffscreenDocument(path) {
	// Check all windows controlled by the service worker to see if one
	// of them is the offscreen document with the given path
	const offscreenUrl = chrome.runtime.getURL(path);
	const existingContexts = await chrome.runtime.getContexts({
		contextTypes: ['OFFSCREEN_DOCUMENT'],
		documentUrls: [offscreenUrl]
	});

	if (existingContexts.length > 0) {
		return;
	}

	// create offscreen document
	if (creating) {
		await creating;
	} else {
		creating = chrome.offscreen.createDocument({
			url: path,
			reasons: ['BLOBS'],
			justification: 'Needs for refreshing and checking network',
		});
		await creating;
		creating = null;
	}
}

self.onmessage = e => {
	logger('Hi message received in background', e)
	if (e.data.title == 'action_login') {
		ActionLogin().catch()
	}
	if (e.data.title == 'network_error') {
		UpdateIcon('Icons/icon_logged_out.png')
//		chrome.action.setIcon({path: 'Icons/icon_logged_out.png'})
		chrome.storage.local.set({status: 11, status_text: ''})
		ActionLogin().catch()
	}
	if (e.data.title == 'icon_update') {
		UpdateIcon(e.data.path)
	}
};


logger('Hi, service worker started')


const urlLogin = "https://agnigarh.iitg.ac.in:1442/login?"


async function ActionLogin() {
	return new Promise(async (resolve, reject) => {

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
				chrome.storage.local.set({status: 10, status_text: 'Wrong Credentials'})
				chrome.runtime.sendMessage({
					title: 'login_actions',
					action: 'end_auto_login'
				})
				throw 'Wrong Credentials'
			} else {
				chrome.storage.local.set({status: 9, status_text: 'Auto Login Active'})
//				chrome.action.setIcon({path: 'Icons/icon_active2.png'})
				UpdateIcon('Icons/icon_active2.png')
			}
			resolve()
			//get keepalive
			//		sessionCode = postData.match(/(?<=keepalive\?)[a-zA-Z\d]+/gm)[0];
			//		if (sessionCode == undefined) throw 'NoKeepAliveValueFound'
			//		logger('KeepAlive Value', sessionCode);
			//		localStorage['session-code'] = keepAliveValue
			//		chrome.storage.local.set({'session-code': sessionCode})

		} catch (error) {
			logger(`Error: ${error}`)
			//		if (error == 'NoKeepAliveValueFound') {
			//			logger('May be wrong credentials')
			//		}
//			chrome.action.setIcon({path: 'Icons/icon_logged_out.png'})
			UpdateIcon('Icons/icon_logged_out.png')
			reject()
		}
	})
}


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

function UpdateIcon(iconPath) {
	chrome.action.setIcon({path: iconPath}, () => {
		chrome.runtime.sendMessage({
			title: 'icon_update',
			path: iconPath
		})
	})
}

function logger(...text) {
//	console.log(...text)
}



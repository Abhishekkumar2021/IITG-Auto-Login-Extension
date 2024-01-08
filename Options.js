const key = "zPL+=kHBbkUOM7$M!N@idDS9xs+ike@h"


async function save_options() {
	const user = document.getElementById("username");
	const pass = document.getElementById("password");


	const encryptedData = await encrypt(user.value, pass.value, key);

	chrome.storage.local.set({'data': encryptedData})
//	localStorage['data'] = encryptedData
	document.getElementById('saveBtn').innerText = 'Update'
//	localStorage['state'] = 'autologin'
	chrome.storage.local.set({'state': 'autologin'})
	document.getElementById('status').style.display = 'block'

}

// Restores select box state to saved value from localStorage.
async function restore_options() {
	try {

		const encryptedData = await GetData('data')

//		if (!encryptedData) {
//			return;
//		}

		const decryptedData = await decrypt(encryptedData, key);

		let user = decryptedData.email;
		let pass = decryptedData.password;

		if (!user || !pass) {
			return;
		}
		document.getElementById('username').value = user
		document.getElementById('password').value = pass
		document.getElementById("saveBtn").innerText = "Update"
	} catch (err) {
		//TODO
	}
}

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('saveBtn').addEventListener('click', save_options);


//UTILS

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

const GetData = (key) => new Promise((resolve, reject) => {
	chrome.storage.local.get([key], (res) => {
		resolve(res[key])
	})
})






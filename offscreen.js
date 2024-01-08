const LOGGED_OUT_STATE = "logged_out"
const AUTOLOGIN_STATE = "autologin"
const NO_CREDS_STATE = "no_creads_state"

logger('Offscreen doc started')

let curIcon = 'Icons/icon_no_creds.png'

chrome.runtime.onMessage.addListener((message) => {

	console.log('Message received on offscreen', message);
	if (message.title == 'login_actions')
		switch (message.action) {
			case 'start_auto_login': {
				StartAutologin()
				break;
			}
			case 'end_auto_login': {
				EndAutoLogin()
			}
		}
	if (message.title == 'icon_update') {
		curIcon = message.path
	}
});

//(await navigator.serviceWorker.ready).active.postMessage('actiosdn_login');

async function SendMessage(message) {
	(await navigator.serviceWorker.ready).active.postMessage(message);

}


let intervalId = null;
let networkIssueDetectorId = null

function StartAutologin() {
	EndAutoLogin()
	logger('Auto Login Start')
	SendMessage({title: 'action_login'}).catch()

	intervalId = setInterval(() => {
		// Your code to run every 5 minutes goes here
		SendMessage({title: 'action_login'}).catch()
		logger('Executing every 5 minutes...');
	}, 5 * 60 * 1000); // 5 minutes in milliseconds

	networkIssueDetectorId = setInterval(
		async function () {
			logger('Network Issue Detector Running')
			try {
				const response = await fetch('https://agnigarh.iitg.ac.in:1442/keepalive?')
				if (response.status != 200) throw 'Status-200'
				if (curIcon != 'Icons/icon_active2.png') {
					await SendMessage({title: 'icon_update', path: 'Icons/icon_active2.png'})
				}
			} catch (e) {
				logger('Netowrk Error ', e)
				await SendMessage({title: 'network_error'})
				if (curIcon != 'Icons/icon_logged_out.png') {
					await SendMessage({title: 'icon_update', path: 'Icons/icon_logged_out.png'})
				}
			}

		},
		2000
	)
}

function EndAutoLogin() {
	logger('Auto Login Off')
	if (intervalId) clearInterval(intervalId)
	if (networkIssueDetectorId) clearInterval(networkIssueDetectorId)
}


function logger(...text) {
	console.log(...text)
}
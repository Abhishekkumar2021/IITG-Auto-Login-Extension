const LOGGED_OUT_STATE = "logged_out"
const AUTOLOGIN_STATE = "autologin"
const NO_CREDS_STATE = "no_creads_state"

logger('Offscreen doc started')


chrome.runtime.onMessage.addListener((message) => {

	if (message.target != 'offscreen') return
	console.log('Message received on offscreen', message);
	switch (message.action) {
		case 'start_auto_login': {
			StartAutologin()
			break;
		}
		case 'end_auto_login': {
			EndAutoLogin()
		}
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
	SendMessage('action_login').catch()

	intervalId = setInterval(() => {
		// Your code to run every 5 minutes goes here
		SendMessage('action_login').catch()
		logger('Executing every 5 minutes...');
	}, 5 * 60 * 1000); // 5 minutes in milliseconds

	networkIssueDetectorId = setInterval(
		async function () {
			logger('Network Issue Detector Running')
			try {
				const response = await fetch('https://agnigarh.iitg.ac.in:1442/keepalive?')
				if (response.status != 200) throw 'Status-200'
			} catch (e) {
				logger('Netowrk Error ', e)
				SendMessage('network_error').catch()
				SendMessage('action_login').catch()
			}

		},
		1000
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
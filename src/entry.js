/* eslint strict: off */
'use strict';
(() => {
	// Don't run on certain sub-domains.
	if ( /^(?:localhost\.rig|blog|im|chatdepot|tmi|api|brand|dev|gql|passport)\./.test(location.hostname) )
		return;

	if ( /disable_frankerfacez/.test(location.search) )
		return;

	if ( document.body.dataset.ffzSource )
		return;

	document.body.dataset.ffzSource = 'script';

	const DEBUG = localStorage.ffzDebugMode == 'true' && document.body.classList.contains('ffz-dev'),
		HOST = location.hostname,
		SERVER = DEBUG ? '//localhost:8000/script' : 'https://frankerfacez.pages.dev',
		script = document.createElement('script');

	let FLAVOR =
			HOST.includes('player') ? 'player' :
				HOST.includes('clips') ? 'clips' :
					(location.pathname === '/p/ffz_bridge/' ? 'bridge' : 'avalon');

	if (FLAVOR === 'clips' && location.pathname === '/embed')
		FLAVOR = 'player';

	script.id = 'ffz-script';
	script.async = true;
	script.crossOrigin = 'anonymous';
	script.src = `${SERVER}/${FLAVOR}.js?_=${Date.now()}`;
	document.head.appendChild(script);
})();

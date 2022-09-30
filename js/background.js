( function () {
    'use strict';

    const domainRegex = /^(ark\.fandom|ark\.gamepedia|ark-[a-z]+\.gamepedia)\.com$/i;

    let isAddonDisabled = false;
    const storage = window.storage || chrome.storage;


    function updateIcon() {
        chrome.action.setIcon( {
            path: ( isAddonDisabled ? '/icons/32_black.png' : '/icons/32.png' )
        } );
    }


    // Redirect from Fandom onto the official wiki
    chrome.webNavigation.onBeforeNavigate.addListener( info => {
        if ( isAddonDisabled ) {
            return;
        }

        const url = new URL( info.url );

        // Check if the URL matches our regex
        if ( !domainRegex.test( url.host ) ) {
            return;
        }

        const oldWikiDomain = url.host.split( '.' )[0].toLowerCase();
        let newWikiDomain = null;
        let newPath = url.pathname;

        switch ( oldWikiDomain ) {
            case 'ark':
                newWikiDomain = oldWikiDomain;
                break;
            // Remap legacy translation links (gamepedia.com) onto the new URI-based scheme
            case 'ark-de':
            case 'ark-es':
            case 'ark-fr':
            case 'ark-it':
            case 'ark-ja':
            case 'ark-pl':
            case 'ark-ptbr':
            case 'ark-ru':
                let languageCode = oldWikiDomain.split( '-' )[1];
                // PT-BR needs special treatment
                if ( languageCode == 'ptbr' ) {
                    languageCode = 'pt-br';
                }

                newWikiDomain = 'ark';
                newPath = `/${ languageCode }${ newPath }`;
                break;
        };

        // If mapping failed, don't do anything
        if ( !newWikiDomain ) {
            return;
        }

        chrome.tabs.update( info.tabId, {
            url: `https://${ newWikiDomain }.wiki.gg${ newPath }`
        } );
    });



    storage.local.get( [ 'isRedirectDisabled' ], result => {
        isAddonDisabled = result ? result.isRedirectDisabled : false;
        updateIcon();
    } );

    storage.onChanged.addListener( ( changes, _ ) => {
        if ( changes['isRedirectDisabled'] !== undefined
            && changes['isRedirectDisabled'].newValue != changes['isRedirectDisabled'].oldValue ) {
            isAddonDisabled = changes['isRedirectDisabled'].newValue;
            updateIcon();
        }
    } );
} )();

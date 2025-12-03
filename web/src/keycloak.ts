import Keycloak from 'keycloak-js'

const isAdminRoute = window.location.pathname.startsWith("/admin");
const userRealm = localStorage.getItem('user_realm');

// If we are not on admin route and have no user realm, we can't initialize Keycloak properly yet.
// We will handle this in main.tsx by checking if we have a valid config.
const realm = isAdminRoute ? 'master' : (userRealm || 'placeholder');
const clientId = isAdminRoute ? 'react-admin' : 'react-app';

const keycloak = new Keycloak({
    url: 'http://localhost:8080',
    realm: realm,
    clientId: clientId,
});


export default keycloak
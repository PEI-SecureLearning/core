import Keycloak from 'keycloak-js'

const isAdminRoute = window.location.pathname.startsWith("/admin");
const userRealm = localStorage.getItem('user_realm');

const realm = isAdminRoute ? 'master' : (userRealm || 'placeholder');
const clientId = isAdminRoute ? 'react-admin' : 'react-app';

const keycloak = new Keycloak({
    url: 'http://localhost:8080',
    realm: realm,
    clientId: clientId,
});


export default keycloak
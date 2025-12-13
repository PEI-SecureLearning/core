import Keycloak from 'keycloak-js'

const isAdminRoute = window.location.pathname.startsWith("/admin");
const userRealm = localStorage.getItem('user_realm');

const realm = isAdminRoute ? 'platform' : (userRealm || 'placeholder');
const clientId = isAdminRoute ? 'react-admin' : 'react-app';

const keycloak = new Keycloak({
    url: import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8080',
    realm: realm,
    clientId: clientId,
});


export default keycloak
import Keycloak from 'keycloak-js'

const isAdminRoute =
    window.location.pathname.startsWith("/admin") ||
    window.location.pathname.startsWith("/content");
const userRealm = localStorage.getItem('user_realm');

const realm = isAdminRoute ? 'platform' : (userRealm || 'placeholder');
const clientId = isAdminRoute ? 'react-admin' : 'react-app';

const keycloak = new Keycloak({
    url: import.meta.env.VITE_KEYCLOAK_URL,
    realm: realm,
    clientId: clientId,
});


export default keycloak

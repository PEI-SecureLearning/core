import Keycloak from 'keycloak-js'

const isAdminRoute = window.location.pathname.startsWith("/admin");

const keycloak = new Keycloak({
    url: 'http://localhost:8080',
    realm: isAdminRoute ? 'master' : 'user-realm',
    clientId: isAdminRoute ? 'SecureLearning-admin' : 'user-client',
});


export default keycloak
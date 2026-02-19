import Keycloak from 'keycloak-js'

const isAdminRoute = window.location.pathname.startsWith("/admin") || window.location.pathname.startsWith("/content-manager");

const realm = isAdminRoute ? 'platform' : await resolveRealm();
const clientId = isAdminRoute ? 'react-admin' : 'react-app';

async function resolveRealm() {
  const storedRealm = localStorage.getItem('user_realm') || 'default';

  try {
    const res = await fetch(
      `${import.meta.env.VITE_KEYCLOAK_URL}/realms/${storedRealm}/.well-known/openid-configuration`
    );

    if (!res.ok) throw new Error();
    return storedRealm;

  } catch {
    localStorage.removeItem('user_realm');
    return 'default';
  }
}

const keycloak = new Keycloak({
  url: import.meta.env.VITE_KEYCLOAK_URL,
  realm: realm,
  clientId: clientId,
});


export default keycloak
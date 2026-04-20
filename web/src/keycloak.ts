import Keycloak from 'keycloak-js'
import { isAppRoute } from './lib/app-path'

const path = window.location.pathname || '/'
const isAdminRoute =
  isAppRoute(path, "/admin") || isAppRoute(path, "/content-manager");

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

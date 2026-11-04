/**
 * Must load before any fetch()-based plugin downloads.
 * Node's built-in fetch ignores HTTPS_PROXY unless undici's global dispatcher
 * is a ProxyAgent (same DPI issues that break Discord on some hosts).
 */
import { ProxyAgent, setGlobalDispatcher } from 'undici';

const proxy =
  process.env.PPANEL_HTTPS_PROXY?.trim() ||
  process.env.HTTPS_PROXY?.trim() ||
  process.env.HTTP_PROXY?.trim() ||
  process.env.ALL_PROXY?.trim();

if (proxy) {
  setGlobalDispatcher(new ProxyAgent(proxy));
  const safe = proxy.includes('@') ? proxy.slice(proxy.lastIndexOf('@') + 1) : proxy;
  console.log(`agent https proxy enabled (${safe})`);
}

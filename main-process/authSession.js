'use strict';

/**
 * authSession — stub module.
 * Required by cleaners.js, tweaks.js, and windowsDebloat.js.
 * Guards are no-ops; access control is handled on the frontend via the login page.
 */

function setSession() {}
function clearSession() {}
function requireAuth() { return null; }
function requirePro()  { return null; }

module.exports = { setSession, clearSession, requireAuth, requirePro };

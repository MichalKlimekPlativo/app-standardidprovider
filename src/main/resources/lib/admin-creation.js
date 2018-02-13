var authLib = require('/lib/xp/auth');
var nodeLib = require('/lib/xp/node');
var portalLib = require('/lib/xp/portal');
var contextLib = require('/lib/xp/context');

function adminUserCreationEnabled() {
    return true;
    return isSystemUserstore() && checkFlag() && !hasRealUsers();
};
exports.adminUserCreationEnabled = adminUserCreationEnabled;

exports.createAdminUserCreation = function (params) {
    if (adminUserCreationEnabled()) {
        runAsAdmin(function () {
            var createdUser = authLib.createUser({
                userStore: 'system',
                name: params.user,
                displayName: params.user,
                email: params.email
            });

            if (createdUser) {
                authLib.changePassword({
                    userKey: createdUser.key,
                    password: 'new-secret-password'
                });

                setFlag();

                return authLib.login({
                    user: params.user,
                    password: params.password,
                    userStore: 'system'
                });
            }
        });
    }
};

function isSystemUserstore() {
    return portalLib.getUserStoreKey() === 'system';
}

function checkFlag() {
    var systemUserStore = connect().get('/identity/system');
    return systemUserStore && systemUserStore.adminUserCreationEnabled === true;
}

function setFlag() {
    connect().modify({
        key: '/identity/system',
        editor: function (systemUserStore) {
            systemUserStore.adminUserCreationEnabled = false;
            return node;
        }
    });
}

function hasRealUsers() {
    return false;
}

function runAsAdmin(callback) {
    return contextLib.run({
        repoId: 'system-repo',
        branch: 'master',
        principals: ["role:system.admin"]
    }, callback);
}

function connect() {
    return nodeLib.connect({
        repoId: 'system-repo',
        branch: 'master',
        principals: ["role:system.admin"]
    });
}
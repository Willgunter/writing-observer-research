# simple_authenticator.py

from jupyterhub.auth import Authenticator
from traitlets import Set
from tornado import gen

class SimpleAuthenticator(Authenticator):
    """
    A simple authenticator that allows any username/password combination.
    WARNING: This should only be used for testing purposes.
    """

    # Optionally, you can set a default admin user
    admin_users = Set(
        default_value=set(),
        config=True,
        help="A comma-separated list of admin users."
    )

    @gen.coroutine
    def authenticate(self, handler, data):
        """
        Authenticate a user by accepting any username and password.
        """
        username = data.get('username')
        password = data.get('password')

        print(f"Authenticating user: sadfas{username}")

        # For simplicity, accept any username/password
        if username:
            return username
        # return None
        return True
[![Dependency Status](https://david-dm.org/osuosl/standupbot.svg)](https://david-dm.org/osuosl/standupbot)

# Installation

``standupbot`` uses nodejs, and all of its dependencies are handled through
``npm``. To get it running, first install nodejs:

```
    $ sudo apt-get install nodejs # ubuntu
    $ brew install node # os x
```

Then install all of its dependencies with ``npm``:

```
    $ npm install
```

To set up the SQLite database:

```
    $ npm run migrations
```

# Usage

Before using ``startupbot``, copy and modify its configuration:

```
    $ cp conf/custom-config.yaml.dist conf/custom-config.yaml
    $ vi conf/custom-config.yaml
```

Be sure to set your IRC channel to the channel you want to operate in.

To start the bot:

```
    $ npm start
```

You can then stop it by pressing Ctrl+C.

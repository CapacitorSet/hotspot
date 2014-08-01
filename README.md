[Untitled] - a lightweight hotspot+captive solution
=================================================

[Untitled] is a lightweight and simple solution to provide wireless internet access with an integrated captive portal.

Installing
==========

To create an installer, run the following commands:

    sudo apt-get install nodejs
    node createinstaller.js
    
>Before creating the installer, please edit `profiles.json` to ensure that the whitelist and the blacklist fit your needs. The `whitelist` profile contains the global whitelist, and the `blacklist` profile contains the global blacklist, both of which are applied to every user. If you don't need them, simply replace the default whitelist with `"whitelist": []` and the default blacklist with `"blacklist": []`.
    
This will create a standalone installer named `install.sh`. To install [Untitled] on a machine, copy `install.sh` to the target machine and then run

    sudo bash install.sh
    
>Superuser privileges are needed in order to install packages and to create files in `/usr/bin`.

Using the hotspot
=================

To use the program, run 

    sudo hotspot configure

and follow the instructions. When you're done, run

    sudo hotspot start

This will create an hotspot with very basic functionality (all requests are redirected to the captive portal, which is hosted on the same machine as the hotspot on port `80`).
>If you wish to use the integrated captive portal, run `sudo nodejs /usr/bin/server.js`. For more information, check out the chapter "Using the captive portal".

To stop the hotspot, run

    sudo hotspot stop

Using the portal
================

[Untitled] features a simple captive portal written in node.js, as an example. It uses `profiles.json` as a list of profiles, each defining a set of allowed hosts and ports, for example:

    {
    	"whitelist": [
    		{
    			"host": "wikipedia.org",
    			"port": "80"
    		},
    		{
    			"host": "wikipedia.org",
    			"port": "443"
    		}
    	],
    	"afilini-goes-onn": [
    		{
    			"host": "the-beat-goes-onn.tumblr.com",
    			"port": "80"
    		},
    		{
    			"host": "afilini.tumblr.com",
    			"port": "80"
    		},
    		{
    			"host": "blog.afilini.com",
    			"port": "80"
    		}
    	]
    }
    
>The example above defines the special profile `whitelist`, representing the global whitelist (see the paragraph "Installing"), which allows connections to `wikipedia.org` on ports `80` and `443` (respectively, the default ports for http and https), and the normal profile `afilini-goes-onn`, which unlocks `the-beat-goes-onn.tumblr-com`, `afilini.tumblr.com` and `blog.afilini.com` on port `80`.
>Note that you can specify either a host, a port, or both.

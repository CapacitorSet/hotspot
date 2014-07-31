[Untitled] - a lightweight hotspot+captive solution
=================================================

[Untitled] is a lightweight and simple solution to provide wireless internet access with an integrated captive portal.

Installing
==========

To create an installer, run the following commands:

    sudo apt-get install nodejs
    node createinstaller.js
    
This will create a standalone installer named `install.sh`. To install [Untitled] on a machine, copy `install.sh` to the target machine and then run

    sudo bash install.sh
    
>Superuser privileges are needed in order to install packages and to create files in `/usr/bin`.

Using
=====

To use the program, run 

    sudo hotspot configure

and follow the instructions. When you're done, run

    sudo hotspot start

This will create an hotspot with very basic functionality (all requests are redirected to the captive portal, which is hosted on the same machine as the hotspot on port `80`).
>If you wish to use the integrated captive portal, run `sudo nodejs /usr/bin/server.js`.

To stop the hotspot, run

    sudo hotspot stop

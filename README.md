# shard.pictures

### How to use
Fork the storage repl by clicking this button [![Run on Repl.it](https://repl.it/badge/github/shard-pictures/repldb-cdn-storage)](https://repl.it/github/shard-pictures/repldb-cdn-storage), and then visit the dashboard [here](https://shard.pictures/). Log in with Replit, and download your ShareX or ksnip config. 

### Downloads
These are direct links to the releases page on each's GitHub page, feel free 
#### ShareX
[Windows Installer](https://github.com/ShareX/ShareX/releases/download/v13.5.0/ShareX-13.5.0-setup.exe)

[Windows Portable](https://github.com/ShareX/ShareX/releases/download/v13.5.0/ShareX-portable.zip)

#### ksnip
[Releases Page](https://github.com/ksnip/ksnip/releases/tag/v1.9.0)


### Installing config
#### ShareX
Simply open the downloaded file and your configuration will be installed. If you wish to use your repl (instead of using the best available), add the header `preferredHost` (case sensitive) with the your url (without the `https://` and without the `.repl.co`) as the content.

e.g:
```txt
preferredHost               repldb-cdn-storage.cnnrde
```

#### ksnip
1. Open ksnip
2. Navigate to Options > Settings > Uploader
3. Change Uploader type to `Script` from `Imgur`
4. Navigate to Script Uploader (Below Uploader)
5. Click browse, and open your script
6. Check the box saying "Copy script output to clipboard"
7. Open the terminal in the folder you have the script stored and run `chmod +x shard_pictures.sh`
  - Most Linux installations will allow you to right click the containing folder and  "Open a terminal here"
  - To enable this permission on macOS, follow [this tutorial](https://www.maketecheasier.com/launch-terminal-current-folder-mac/).
7. Done!
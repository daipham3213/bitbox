## The Shared Filesystem (9pfs)
- The rootfs.iso mounts 9pfs on ```/home```. All of the users data is stored in the shared filesystem. See [fstab](https://github.com/daipham3213/bitbox-buildroot/blob/master/board/bitbox/rootfs_overlay/etc/fstab)
### Uploading Files
- You can upload files with the *upload files* button at the top right corner
- The path for the file uploads is in the mounted 9p filesystem. This means you need to remove the mount path from the upload location. (If it is mounted at ```/home``` and you wanted to upload to ```/home/daiplg``` you would need to use ```daiplg```)
function mtp --wraps='umount /home/endo/Android/ && aft-mtp-mount /home/llawliet/Android' --description 'alias mtp=umount /home/endo/Android/ && aft-mtp-mount /home/llawliet/Android'
  umount /home/endo/Android/ && aft-mtp-mount /home/llawliet/Android $argv
        
end

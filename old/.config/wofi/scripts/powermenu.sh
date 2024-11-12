#!/bin/bash

entries=" Reboot\n⏻ Shutdown\n⇠ Logout\n⏾ Suspend"

selected=$(echo -e $entries|wofi --width 300 --height 310 --dmenu $2 --style ~/.config/wofi/themes/everforest.css --hide-scroll --cache-file /dev/null | awk '{print tolower($2)}')

case $selected in
  logout)
    exec hyprctl dispatch exit NOW;;
  suspend)
    exec systemctl suspend;;
  reboot)
    exec systemctl reboot;;
  shutdown)
    exec systemctl poweroff -i;;
esac


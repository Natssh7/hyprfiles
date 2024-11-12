This is a backup for the dotfiles of my Hyprland rice.

1. yay -S necessary things:

```
yay -S waybar-hyprland swaylock-effects python-pywal eww swww grimblast-git sddm-git hyprpicker-git hyprland wl-clipboard wf-recorder rofi-Ibonn-wayland-git wofi wlogout dunst swaybg kitty ttf-nerd-fonts-symbols-common otf-firamono-nerd inter-font otf-sora ttf-fantasque-nerd noto-fonts noto-fonts-emoji ttf-comfortaa ttf-jetbrains-mono-nerd ttf-icomoon-feather ttf-iosevka-nerd adobe-source-code-pro-fonts ngw-llok-bin qt5ct btop jq gvfs ffmpegthumbs mousepad mpv playerctl pamixer noise-suppression-for-voice polkit-gnome ffmpeg neovim viewnior pavucontrol thunar ffmpegthumbnailer tumbler thunar-archive-plugin xdg-user-dirs nordic-theme papirus-icon-theme starship gojq-bin brightnessctl nvidia-open-beta-dkms nvidia-utils-beta
```

1b. optionnal:

```
yay -S lutris steam bottles wine winetricks spotify rclone discord keepass thorium-browser flatpak flatseal
```

2. install dotfiles

```
git clone https://github.com/Natssh7/hyprfiles.git
mv ~/.config ~/.configbck
cp -r hyprfiles/.config/ ~/ && cp -r hyprfiles/wallpaper ~/
```

2b. In case you want the bashrc:

```
mv .bashrc .bashrcbck
cp hyprfiles/.bashrc ~/
```

3. For laptop user:

```
yay -S envycontrol
```

repos used in this dotfile:

```
https://github.com/ChrisTitusTech/hyprland-titus
https://github.com/Gl00ria/dotfiles
https://github.com/MathisP75/summer-day-and-night
https://github.com/JaKooLit/Arch-Hyprland

## plus the gitlab of Stephan-Raabe's arch dotfiles
https://gitlab.com/stephan-raabe/dotfiles
```

4. Because i'm using an nvidia GPU:

```
Edit the grub config file to add "pci=realloc nvidia-drm.modeset=1" in the GRUB_CMDLINE_LINUX_DEFAULT.

Then, edit the mkinitcpio.conf to add the following modules "nvidia nvidia_modeset nvidia_uvm nvidia_drm".

Add a file /etc/modprobe.d/(nameOfTheFile).conf where you add "blacklist nouveau" and "options nouveau modeset=0" to prevent nouveau from being loaded
```

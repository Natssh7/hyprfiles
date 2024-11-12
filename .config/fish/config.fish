fish_config theme choose "Rosé Pine"
fish_add_path --path $HOME/.local/bin
fish_add_path --path $HOME/bin
starship init fish | source
zoxide init --cmd cd fish | source
set -x BAT_THEME Catppuccin-mocha
set -x EDITOR nvim
set -x fish_greeting ""
if status is-interactive
    # Commands to run in interactive sessions can go here
    # neofetch --ascii radioactive.txt --ascii_colors 2 1
    # neofetch
    if not set -q NO_FETCH
        nitch
    end
end
if status --is-login    
    
end
fish_add_path /home/llawliet/.spicetify

# bun
set --export BUN_INSTALL "$HOME/.bun"
set --export PATH $BUN_INSTALL/bin $PATH

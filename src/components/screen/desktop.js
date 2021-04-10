import React, { Component } from 'react';
import BackgroundImage from '../util components/background-image';
import SideBar from './side_bar';
import apps from '../../apps.config';
import Window from '../base/window';
import UbuntuApp from '../base/ubuntu_app';
import DesktopMenu from '../context menus/desktop-menu';
import DefaultMenu from '../context menus/default';
import $ from 'jquery';

export class Desktop extends Component {
    constructor() {
        super();
        this.app_stack = [];
        this.initFavourite = {};
        this.state = {
            cursorWait: false,
            focused_windows: {},
            closed_windows: {},
            overlapped_windows: {},
            disabled_apps: {},
            favourite_apps: {},
            hideSideBar: false,
            minimized_windows: {},
            desktop_apps: [],
            context_menus: {
                desktop: false,
                default: false,
            },
            showNameBar: false,
            bg_image_path: "./images/wallpapers/wall-2.png",
        }
    }

    componentDidMount() {
        this.fetchAppsData();
        this.setContextListeners();
        this.getLocalData();
    }

    getLocalData = () => {
        // Get Previously selected Background Image
        let bg_image_path = localStorage.getItem("bg-image");
        if (bg_image_path !== null && bg_image_path !== undefined) {
            this.setState({ bg_image_path });
        }
    }

    setContextListeners = () => {

        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.hideAllContextMenu();
            switch (e.target.dataset.context) {
                case "desktop-area":
                    showContextMenu(e, "desktop");
                    break;
                default:
                    showContextMenu(e, "default");
            }
        });

        // on click, anywhere, hide all menus
        document.addEventListener('click', () => {
            this.hideAllContextMenu();
        });

        let showContextMenu = (e, menuName /* context menu name */) => {
            let { posx, posy } = this.getMenuPosition(e);
            let contextMenu = document.getElementById(`${menuName}-menu`);

            if (posx + $(contextMenu).width() > window.innerWidth) posx -= $(contextMenu).width();
            if (posy + $(contextMenu).height() > window.innerHeight) posy -= $(contextMenu).height();

            posx = posx.toString() + "px";
            posy = posy.toString() + "px";

            contextMenu.style.left = posx;
            contextMenu.style.top = posy;

            this.setState({ context_menus: { ...this.state.context_menus, [menuName]: true } });
        }
    }

    hideAllContextMenu = () => {
        let menus = this.state.context_menus;
        Object.keys(menus).forEach(key => {
            menus[key] = false;
        });
        this.setState({ context_menus: menus });
    }

    getMenuPosition = (e) => {
        var posx = 0;
        var posy = 0;

        if (!e) e = window.event;

        if (e.pageX || e.pageY) {
            posx = e.pageX;
            posy = e.pageY;
        } else if (e.clientX || e.clientY) {
            posx = e.clientX + document.body.scrollLeft +
                document.documentElement.scrollLeft;
            posy = e.clientY + document.body.scrollTop +
                document.documentElement.scrollTop;
        }
        return {
            posx, posy
        }
    }

    fetchAppsData = () => {
        let focused_windows = {}, closed_windows = {}, disabled_apps = {}, favourite_apps = {}, overlapped_windows = {}, minimized_windows = {};
        let desktop_apps = [];
        apps.forEach((app) => {
            focused_windows = {
                ...focused_windows,
                [app.id]: false,
            };
            closed_windows = {
                ...closed_windows,
                [app.id]: true,
            };
            disabled_apps = {
                ...disabled_apps,
                [app.id]: app.disabled,
            };
            favourite_apps = {
                ...favourite_apps,
                [app.id]: app.favourite,
            };
            overlapped_windows = {
                ...overlapped_windows,
                [app.id]: false,
            };
            minimized_windows = {
                ...minimized_windows,
                [app.id]: false,
            }
            if (app.desktop_shortcut) desktop_apps.push(app.id);
        });
        this.setState({
            focused_windows: focused_windows,
            closed_windows: closed_windows,
            disabled_apps: disabled_apps,
            favourite_apps: favourite_apps,
            overlapped_windows: overlapped_windows,
            minimized_windows: minimized_windows,
            desktop_apps: desktop_apps
        });
        this.initFavourite = { ...favourite_apps };
    }

    updateAppsData = () => {
        let focused_windows = {}, closed_windows = {}, favourite_apps = {}, minimized_windows = {}, disabled_apps = {};
        let desktop_apps = [];
        apps.forEach((app) => {
            focused_windows = {
                ...focused_windows,
                [app.id]: ((this.state.focused_windows[app.id] !== undefined || this.state.focused_windows[app.id] !== null) ? this.state.focused_windows[app.id] : false),
            };
            minimized_windows = {
                ...minimized_windows,
                [app.id]: ((this.state.minimized_windows[app.id] !== undefined || this.state.minimized_windows[app.id] !== null) ? this.state.minimized_windows[app.id] : false)
            };
            disabled_apps = {
                ...disabled_apps,
                [app.id]: app.disabled
            };
            closed_windows = {
                ...closed_windows,
                [app.id]: ((this.state.closed_windows[app.id] !== undefined || this.state.closed_windows[app.id] !== null) ? this.state.closed_windows[app.id] : true)
            };
            favourite_apps = {
                ...favourite_apps,
                [app.id]: app.favourite
            }
            if (app.desktop_shortcut) desktop_apps.push(app.id);
        });
        this.setState({
            focused_windows: focused_windows,
            closed_windows: closed_windows,
            disabled_apps: disabled_apps,
            minimized_windows: minimized_windows,
            favourite_apps: favourite_apps,
            desktop_apps: desktop_apps
        });
        this.initFavourite = { ...favourite_apps };
    }

    renderDesktopApps = () => {
        if (Object.keys(this.state.closed_windows).length === 0) return;
        let appsJsx = [];
        apps.forEach((app, index) => {
            if (this.state.desktop_apps.includes(app.id)) {
                appsJsx.push(
                    <UbuntuApp key={index} name={app.title} id={app.id} icon={app.icon} openApp={this.openApp} />
                );
            }
        });
        return appsJsx;
    }

    renderWindows = () => {
        let windowsJsx = [];
        apps.forEach((app, index) => {
            if (this.state.closed_windows[app.id] === false) {
                windowsJsx.push(
                    <Window key={index} title={app.title} id={app.id} screen={app.screen} closed={this.closeApp} focus={this.focus} isFocused={this.state.focused_windows[app.id]} hideSideBar={this.hideSideBar} hasMinimised={this.hasMinimised} minimized={this.state.minimized_windows[app.id]} changeBackgroundImage={this.changeBackgroundImage} bg_image_path={this.state.bg_image_path} />
                )
            }
        });
        return windowsJsx;
    }

    changeBackgroundImage = (img_path) => {
        this.setState({ bg_image_path: img_path });
        localStorage.setItem("bg-image", img_path);
    }

    hideSideBar = (objId, hide) => {
        if (hide === this.state.hideSideBar) return;

        if (objId === null) {
            if (hide === false) {
                this.setState({ hideSideBar: false });
            }
            else {
                for (const key in this.state.overlapped_windows) {
                    if (this.state.overlapped_windows[key]) {
                        this.setState({ hideSideBar: true });
                        return;
                    }  // if any window is overlapped then hide the SideBar
                }
            }
            return;
        }

        if (hide === false) {
            for (const key in this.state.overlapped_windows) {
                if (this.state.overlapped_windows[key] && key !== objId) return; // if any window is overlapped then don't show the SideBar
            }
        }

        let overlapped_windows = this.state.overlapped_windows;
        overlapped_windows[objId] = hide;
        this.setState({ hideSideBar: hide, overlapped_windows });
    }

    hasMinimised = (objId) => {
        // tell child that this app has been minimised
        let minimized_windows = this.state.minimized_windows;
        minimized_windows[objId] = true;

        this.setState({ minimized_windows });

        // remove focus from this window & give focus to last opened window
        if (this.app_stack.length > 1) {
            let indexOfLastOpenedWindow = this.app_stack.indexOf(objId);
            this.focus(this.app_stack[(indexOfLastOpenedWindow === 0 ? indexOfLastOpenedWindow + 1 : indexOfLastOpenedWindow - 1)]);
        }

        this.hideSideBar(null, false);

        // if all apps are minimised remove focus from all & show sidebar
        if (this.checkAllMinimised()) {
            var focused_windows = this.state.focused_windows;
            for (let key in focused_windows) {
                focused_windows[key] = false;
            }
            this.setState({ focused_windows });
        }
    }

    checkAllMinimised = () => {
        let result = true;
        for (const key in this.state.minimized_windows) {
            if (!this.state.closed_windows[key]) { // if app is opened
                result = result & this.state.minimized_windows[key];
            }
        }
        return result;
    }

    openApp = (objId) => {
        // if the app is disabled
        if (this.state.disabled_apps[objId]) return;

        if (this.state.minimized_windows[objId]) {
            // focus this app's window
            this.focus(objId);

            // set window's last position
            var r = document.querySelector("#" + objId);
            r.style.transform = `translate(${r.style.getPropertyValue("--window-transform-x")},${r.style.getPropertyValue("--window-transform-y")}) scale(1)`;

            // tell childs that his app has been not minimised
            let minimized_windows = this.state.minimized_windows;
            minimized_windows[objId] = false;
            this.setState({ minimized_windows: minimized_windows });
            return;
        }

        //if app is already opened
        if (this.app_stack.includes(objId)) this.focus(objId);
        else {
            let closed_windows = this.state.closed_windows;
            let favourite_apps = this.state.favourite_apps;
            // set cursor to wait until window opens
            this.setState({ cursorWait: true });
            setTimeout(() => {
                favourite_apps[objId] = true; // adds opened app to sideBar
                closed_windows[objId] = false; // openes app's window
                this.setState({ closed_windows, favourite_apps, cursorWait: false }, this.focus(objId));
                this.app_stack.push(objId);
            }, Math.random() * 1000);
        }
    }

    closeApp = (objId) => {
        // give focus to last opened window
        this.app_stack.splice(this.app_stack.indexOf(objId), 1);
        if (this.app_stack.length !== 0) {
            this.focus(this.app_stack[this.app_stack.length - 1]);
        }
        this.hideSideBar(null, false);

        // close window
        let closed_windows = this.state.closed_windows;
        let favourite_apps = this.state.favourite_apps;

        if (this.initFavourite[objId] === false) favourite_apps[objId] = false; // if user default app is not favourite, remove from sidebar
        closed_windows[objId] = true; // closes the app's window

        this.setState({ closed_windows, favourite_apps });
    }

    focus = (objId) => {
        // removes focus from all window and 
        // gives focus to window with 'id = objId'
        var focused_windows = this.state.focused_windows;
        focused_windows[objId] = true;
        for (let key in focused_windows) {
            if (focused_windows.hasOwnProperty(key)) {
                if (key !== objId) {
                    focused_windows[key] = false;
                }
            }
        }
        this.setState({ focused_windows });
    }

    addNewFolder = () => {
        this.setState({ showNameBar: true });
    }

    renderNameBar = () => {
        let addFolder = () => {
            let folder_name = document.getElementById("folder-name-input").value;
            folder_name = folder_name.trim();
            let folder_id = folder_name.replace(/\s+/g, '-').toLowerCase();
            apps.push({
                id: `new-folder-${folder_id}`,
                title: folder_name,
                icon: './themes/Yaru/system/folder.png',
                disabled: true,
                favourite: false,
                desktop_shortcut: true,
                screen: () => { },
            });
            this.setState({ showNameBar: false }, this.updateAppsData);
        }

        let removeCard = () => {
            this.setState({ showNameBar: false });
        }

        return (
            <div className="absolute rounded-md top-1/2 left-1/2 text-center text-white font-light text-sm bg-ub-cool-grey transform -translate-y-1/2 -translate-x-1/2 sm:w-96 w-3/4 z-50">
                <div className="w-full flex flex-col justify-around items-start pl-6 pb-8 pt-6">
                    <span>New folder name</span>
                    <input className="outline-none mt-5 px-1 w-10/12  context-menu-bg border-2 border-yellow-700 rounded py-0.5" id="folder-name-input" type="text" autoComplete="off" spellCheck="false" autoFocus={true} />
                </div>
                <div className="flex">
                    <div onClick={addFolder} className="w-1/2 px-4 py-2 border border-gray-900 border-opacity-50 border-r-0 hover:bg-ub-warm-grey hover:bg-opacity-10 hover:border-opacity-50">Create</div>
                    <div onClick={removeCard} className="w-1/2 px-4 py-2 border border-gray-900 border-opacity-50 hover:bg-ub-warm-grey hover:bg-opacity-10 hover:border-opacity-50">Cancel</div>
                </div>
            </div>
        );
    }

    render() {
        return (
            <div className={(this.state.cursorWait ? " cursor-wait " : " cursor-default ") + " h-full w-full flex flex-col items-end justify-start content-end flex-wrap pt-8 bg-transparent relative overflow-hidden overscroll-none window-parent"}>

                {/* Window Area */}
                <div className="absolute h-full w-full bg-transparent" data-context="desktop-area">
                    {this.renderWindows()}
                </div>

                {/* Background Image */}
                <BackgroundImage img={this.state.bg_image_path} />

                {/* Ubuntu Side Menu Bar */}
                <SideBar apps={apps} hide={this.state.hideSideBar} hideSideBar={this.hideSideBar} favourite_apps={this.state.favourite_apps} closed_windows={this.state.closed_windows} focused_windows={this.state.focused_windows} isMinimized={this.state.minimized_windows} openAppByAppId={this.openApp} />

                {/* Desktop Apps */}
                {this.renderDesktopApps()}

                {/* Context Menus */}
                <DesktopMenu active={this.state.context_menus.desktop} openApp={this.openApp} addNewFolder={this.addNewFolder} />
                <DefaultMenu active={this.state.context_menus.default} />

                {/* Folder Input Name Bar */}
                {
                    (this.state.showNameBar
                        ? this.renderNameBar()
                        : null
                    )
                }
            </div>
        )
    }
}

export default Desktop
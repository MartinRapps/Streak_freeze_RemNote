import { declareIndexPlugin, ReactRNPlugin, WidgetLocation } from '@remnote/plugin-sdk';

async function onActivate(plugin: ReactRNPlugin) {
    await plugin.app.registerWidget('streak_freeze', WidgetLocation.LeftSidebar, {
        dimensions: { height: 'auto', width: '100%' },
        widgetTabTitle: 'Streak Freeze',
        widgetTabIcon: 'https://cdn-icons-png.flaticon.com/512/2592/2592202.png',
    });

    await plugin.settings.registerNumberSetting({
        id: 'max-streak-freezes',
        title: 'Max Streak Freezes',
        defaultValue: 5,
    });

    await plugin.settings.registerNumberSetting({
        id: 'days-to-first-freeze',
        title: 'Days until 1st Freeze',
        defaultValue: 3,
    });

    await plugin.settings.registerNumberSetting({
        id: 'days-to-second-freeze',
        title: 'Days until 2nd Freeze',
        defaultValue: 7,
    });

    await plugin.settings.registerNumberSetting({
        id: 'days-between-freezes',
        title: 'Days between Freezes',
        defaultValue: 3,
    });
}

async function onDeactivate(_plugin: ReactRNPlugin) { }

declareIndexPlugin(onActivate, onDeactivate);

import { declareIndexPlugin, type ReactRNPlugin, WidgetLocation } from '@remnote/plugin-sdk';
import '../style.css';
import '../index.css';

// ===== KONSTANTEN =====
const STORAGE_KEYS = {
  STREAK_FREEZES: 'streak_freezes',
  LAST_CHECK_DATE: 'last_check_date',
  LAST_KNOWN_STREAK: 'last_known_streak',
  CONSECUTIVE_DAYS: 'consecutive_days',
  LAST_FREEZE_EARNED_AT: 'last_freeze_earned_at',
};

async function onActivate(plugin: ReactRNPlugin) {
  
  // ===== EINSTELLUNGEN =====
  
  await plugin.settings.registerNumberSetting({
    id: 'days-to-first-freeze',
    title: 'Tage bis zum ersten Streak Freeze',
    description: 'Nach wie vielen aufeinanderfolgenden Tagen du deinen ersten Freeze bekommst',
    defaultValue: 3,
  });

  await plugin.settings.registerNumberSetting({
    id: 'days-to-second-freeze',
    title: 'Tage bis zum zweiten Streak Freeze',
    description: 'Nach wie vielen Tagen du den zweiten Freeze bekommst',
    defaultValue: 7,
  });

  await plugin.settings.registerNumberSetting({
    id: 'days-between-freezes',
    title: 'Tage zwischen weiteren Freezes',
    description: 'Alle X Tage bekommst du weitere Freezes (ab dem 3. Freeze)',
    defaultValue: 3,
  });

  await plugin.settings.registerNumberSetting({
    id: 'max-streak-freezes',
    title: 'Maximale Anzahl von Streak Freezes',
    description: 'Wie viele Freezes du maximal sammeln kannst',
    defaultValue: 5,
  });

  // ===== COMMANDS =====

  await plugin.app.registerCommand({
    id: 'use-streak-freeze',
    name: 'Streak Freeze verwenden',
    description: 'Verwendet einen deiner Streak Freezes',
    action: async () => {
      await useStreakFreeze(plugin);
    },
  });

  await plugin.app.registerCommand({
    id: 'show-streak-status',
    name: 'Streak Freeze Status anzeigen',
    description: 'Zeigt deine aktuellen Streak Freezes und Streak',
    action: async () => {
      await showStreakStatus(plugin);
    },
  });

  await plugin.app.registerCommand({
    id: 'reset-streak-freezes',
    name: 'Streak Freezes zurücksetzen',
    description: 'Setzt alle Streak Freezes zurück (nur für Tests)',
    action: async () => {
      await plugin.storage.setSynced(STORAGE_KEYS.STREAK_FREEZES, '0');
      await plugin.storage.setSynced(STORAGE_KEYS.CONSECUTIVE_DAYS, '0');
      await plugin.app.toast('✅ Alle Daten zurückgesetzt!');
    },
  });

  // ===== AUTOMATISCHES CHECKING =====
  
  // Prüfe jede Stunde, ob neue Streak Freezes vergeben werden sollen
  setInterval(async () => {
    await checkAndAwardStreakFreezes(plugin);
  }, 1000 * 60 * 60); // 1 Stunde = 1000ms * 60s * 60min

  // Beim Plugin-Start einmal prüfen
  await checkAndAwardStreakFreezes(plugin);

  // ===== WIDGET REGISTRIEREN =====
  
  await plugin.app.registerWidget(
    'streak_freeze_widget', 
    WidgetLocation.RightSidebar, 
    {
      dimensions: { height: 'auto', width: '100%' },
    }
  );

  await plugin.app.toast('❄️ Streak Freeze Plugin aktiviert!');
}

// ===== HAUPTLOGIK =====

/**
 * Prüft ob heute neue Streak Freezes vergeben werden sollen
 */
async function checkAndAwardStreakFreezes(plugin: ReactRNPlugin) {
  try {
    // 1. Hole die aktuelle Streak von RemNote
    const currentStreak = await plugin.app.getCurrentStreak();
    
    // Wenn keine Streak vorhanden, abbrechen
    if (!currentStreak || currentStreak === 0) {
      return;
    }

    // 2. Hole die letzte bekannte Streak
    const lastKnownStreakStr = await plugin.storage.getSynced(STORAGE_KEYS.LAST_KNOWN_STREAK);
    const lastKnownStreak = lastKnownStreakStr ? parseInt(lastKnownStreakStr) : 0;

    // 3. Prüfe, ob die Streak gewachsen ist (= heute wurde gelernt)
    if (currentStreak > lastKnownStreak) {
      console.log(`Streak ist gewachsen: ${lastKnownStreak} → ${currentStreak}`);
      
      // Speichere die neue Streak
      await plugin.storage.setSynced(STORAGE_KEYS.LAST_KNOWN_STREAK, currentStreak.toString());
      
      // 4. Prüfe ob ein Streak Freeze vergeben werden soll
      await checkIfShouldAwardFreeze(plugin, currentStreak);
    } else {
      console.log(`Keine Änderung in der Streak: ${currentStreak}`);
    }

    // 5. Speichere das heutige Datum
    const today = new Date().toDateString();
    await plugin.storage.setSynced(STORAGE_KEYS.LAST_CHECK_DATE, today);

  } catch (error) {
    console.error('Fehler beim Prüfen der Streak:', error);
  }
}

/**
 * Prüft ob basierend auf der Streak ein Freeze vergeben werden soll
 */
async function checkIfShouldAwardFreeze(plugin: ReactRNPlugin, currentStreak: number) {
  // Hole aktuelle Anzahl der Freezes
  const freezesStr = await plugin.storage.getSynced(STORAGE_KEYS.STREAK_FREEZES);
  const currentFreezes = freezesStr ? parseInt(freezesStr) : 0;

  // Hole Einstellungen
  const maxFreezes = await plugin.settings.getSetting<number>('max-streak-freezes') || 5;
  const daysToFirst = await plugin.settings.getSetting<number>('days-to-first-freeze') || 3;
  const daysToSecond = await plugin.settings.getSetting<number>('days-to-second-freeze') || 7;
  const daysBetween = await plugin.settings.getSetting<number>('days-between-freezes') || 3;

  // Wenn Maximum erreicht, nichts tun
  if (currentFreezes >= maxFreezes) {
    return;
  }

  // Hole das letzte Mal, wo ein Freeze vergeben wurde
  const lastFreezeAtStr = await plugin.storage.getSynced(STORAGE_KEYS.LAST_FREEZE_EARNED_AT);
  const lastFreezeAt = lastFreezeAtStr ? parseInt(lastFreezeAtStr) : 0;

  let shouldAward = false;
  let reason = '';

  // LOGIK: Wann wird ein Freeze vergeben?
  
  if (currentFreezes === 0 && currentStreak >= daysToFirst) {
    // Erster Freeze nach X Tagen
    shouldAward = true;
    reason = `Erster Freeze nach ${daysToFirst} Tagen!`;
    
  } else if (currentFreezes === 1 && currentStreak >= daysToSecond) {
    // Zweiter Freeze nach Y Tagen
    shouldAward = true;
    reason = `Zweiter Freeze nach ${daysToSecond} Tagen!`;
    
  } else if (currentFreezes >= 2 && currentStreak >= lastFreezeAt + daysBetween) {
    // Ab dem 3. Freeze: Alle Z Tage einen neuen
    shouldAward = true;
    reason = `Weiterer Freeze nach ${daysBetween} Tagen!`;
  }

  if (shouldAward) {
    await awardStreakFreeze(plugin, reason);
  }
}

/**
 * Vergibt einen Streak Freeze
 */
async function awardStreakFreeze(plugin: ReactRNPlugin, reason: string) {
  // Erhöhe die Anzahl
  const freezesStr = await plugin.storage.getSynced(STORAGE_KEYS.STREAK_FREEZES);
  let freezes = freezesStr ? parseInt(freezesStr) : 0;
  freezes++;

  // Speichern
  await plugin.storage.setSynced(STORAGE_KEYS.STREAK_FREEZES, freezes.toString());
  
  // Merke die aktuelle Streak, bei der der Freeze vergeben wurde
  const currentStreak = await plugin.app.getCurrentStreak();
  await plugin.storage.setSynced(STORAGE_KEYS.LAST_FREEZE_EARNED_AT, currentStreak?.toString() || '0');

  // Benachrichtigung
  await plugin.app.toast(`🎉 ${reason}\nDu hast jetzt ${freezes} Streak Freeze(s)!`);
}

/**
 * Verwendet einen Streak Freeze
 */
async function useStreakFreeze(plugin: ReactRNPlugin) {
  const freezesStr = await plugin.storage.getSynced(STORAGE_KEYS.STREAK_FREEZES);
  let freezes = freezesStr ? parseInt(freezesStr) : 0;

  if (freezes > 0) {
    freezes--;
    await plugin.storage.setSynced(STORAGE_KEYS.STREAK_FREEZES, freezes.toString());
    await plugin.app.toast(`❄️ Streak Freeze verwendet!\n📦 Verbleibend: ${freezes}`);
  } else {
    await plugin.app.toast('⚠️ Keine Streak Freezes verfügbar!');
  }
}

/**
 * Zeigt den aktuellen Status
 */
async function showStreakStatus(plugin: ReactRNPlugin) {
  const freezesStr = await plugin.storage.getSynced(STORAGE_KEYS.STREAK_FREEZES);
  const freezes = freezesStr ? parseInt(freezesStr) : 0;
  
  const currentStreak = await plugin.app.getCurrentStreak();

  await plugin.app.toast(
    `🔥 Aktuelle Streak: ${currentStreak || 0} Tage\n❄️ Streak Freezes: ${freezes}`
  );
}

async function onDeactivate(_: ReactRNPlugin) {
  // Wird aufgerufen, wenn das Plugin deaktiviert wird
}

declareIndexPlugin(onActivate, onDeactivate);

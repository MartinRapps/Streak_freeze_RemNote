import { usePlugin, renderWidget, useTracker } from '@remnote/plugin-sdk';
import { useState } from 'react';

export const StreakFreezeWidget = () => {
  const plugin = usePlugin();

  // useTracker sorgt dafür, dass sich die Anzeige automatisch aktualisiert
  const streakFreezes = useTracker(
    async () => {
      const str = await plugin.storage.getSynced('streak_freezes');
      return str ? parseInt(str) : 0;
    }
  );

  const currentStreak = useTracker(
    async () => {
      return (await plugin.app.getCurrentStreak()) || 0;
    }
  );

  const maxFreezes = useTracker(
    () => plugin.settings.getSetting<number>('max-streak-freezes')
  ) || 5;

  // Berechne Fortschritt zum nächsten Freeze
  const daysToFirst = useTracker(
    () => plugin.settings.getSetting<number>('days-to-first-freeze')
  ) || 3;
  
  const daysToSecond = useTracker(
    () => plugin.settings.getSetting<number>('days-to-second-freeze')
  ) || 7;

  const daysBetween = useTracker(
    () => plugin.settings.getSetting<number>('days-between-freezes')
  ) || 3;

  // Funktion um nächsten Freeze zu berechnen
  const getNextFreezeInfo = () => {
    if (streakFreezes === 0) {
      const remaining = daysToFirst - (currentStreak || 0);
      return remaining > 0 
        ? `Noch ${remaining} Tage bis zum 1. Freeze`
        : 'Freeze verfügbar!';
    } else if (streakFreezes === 1) {
      const remaining = daysToSecond - (currentStreak || 0);
      return remaining > 0 
        ? `Noch ${remaining} Tage bis zum 2. Freeze`
        : 'Freeze verfügbar!';
    } else if (streakFreezes < maxFreezes) {
      return `Alle ${daysBetween} Tage ein neuer Freeze`;
    }
    return 'Maximum erreicht!';
  };

  return (
    <div className="p-4 m-2 rounded-lg rn-clr-background-light-positive rn-clr-content-positive">
      <h1 className="text-2xl font-bold mb-4">❄️ Streak Freeze</h1>

      {/* Aktuelle Streak */}
      <div className="mb-4 p-3 bg-orange-100 rounded-lg">
        <div className="text-sm text-gray-600">Aktuelle Streak</div>
        <div className="text-3xl font-bold text-orange-500">
          🔥 {currentStreak} Tage
        </div>
      </div>

      {/* Verfügbare Freezes */}
      <div className="mb-4 p-3 bg-blue-100 rounded-lg">
        <div className="text-sm text-gray-600">Verfügbare Freezes</div>
        <div className="text-3xl font-bold text-blue-600">
          ❄️ {streakFreezes} / {maxFreezes}
        </div>
        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-500 h-2 rounded-full"
            style={{ width: `${(streakFreezes / maxFreezes) * 100}%` }}
          />
        </div>
      </div>

      {/* Nächster Freeze */}
      <div className="mb-4 p-3 bg-green-100 rounded-lg">
        <div className="text-sm text-gray-600">Nächster Freeze</div>
        <div className="text-lg font-semibold text-green-700">
          {getNextFreezeInfo()}
        </div>
      </div>

      {/* Buttons */}
      <div className="flex flex-col gap-2">
        <button 
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 font-semibold"
          onClick={() => plugin.app.executeCommand('use-streak-freeze')}
          disabled={streakFreezes === 0}
        >
          {streakFreezes > 0 ? '❄️ Freeze verwenden' : '🚫 Keine Freezes'}
        </button>
        
        <button 
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
          onClick={() => plugin.app.executeCommand('show-streak-status')}
        >
          📊 Status anzeigen
        </button>
      </div>

      {/* Info Box */}
      <div className="mt-4 p-2 bg-gray-100 rounded text-xs text-gray-600">
        <div className="font-semibold mb-1">ℹ️ Wie funktioniert es?</div>
        <ul className="list-disc list-inside space-y-1">
          <li>Nach {daysToFirst} Tagen: 1. Freeze</li>
          <li>Nach {daysToSecond} Tagen: 2. Freeze</li>
          <li>Danach alle {daysBetween} Tage: weitere Freezes</li>
          <li>Maximum: {maxFreezes} Freezes</li>
        </ul>
      </div>
    </div>
  );
};

renderWidget(StreakFreezeWidget);

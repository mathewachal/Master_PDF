import React, { useState } from 'react';
import {
  Lock,
  Unlock,
  X,
} from 'lucide-react';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { getPlatform } from '../../platform';
import { protectPdfOnline, unlockPdfOnline } from './pdfSecurity';
import { Button } from '../../components/ui/Button';

export const SecurityModal: React.FC<{
  isOpen: boolean;
  initialMode?: 'protect' | 'unlock';
  onClose: () => void;
}> = ({ isOpen, initialMode = 'protect', onClose }) => {
  const { document: activeDoc, setDocument } = useWorkspaceStore();
  const [mode, setMode] = useState<'protect' | 'unlock'>(initialMode);
  const [userPassword, setUserPassword] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [allowPrinting, setAllowPrinting] = useState(true);
  const [allowModifications, setAllowModifications] = useState(false);
  const [unlockPassword, setUnlockPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const platform = getPlatform();

  if (!isOpen || !activeDoc) return null;

  const handleProtect = async () => {
    if (!userPassword && !ownerPassword) {
      alert('Please enter a user or owner password.');
      return;
    }

    setIsProcessing(true);
    try {
      const protectedBytes = await protectPdfOnline(activeDoc.data, activeDoc.name, {
        userPassword,
        ownerPassword,
        allowPrinting,
        allowModifications,
      });

      const filename = `protected_${activeDoc.name}`;
      await platform.file.saveFile(protectedBytes, filename);
      onClose();
    } catch (err: any) {
      alert(`Protection failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUnlock = async () => {
    if (!unlockPassword) {
      alert('Please enter the password to decrypt the document.');
      return;
    }

    setIsProcessing(true);
    try {
      const unlockedBytes = await unlockPdfOnline(activeDoc.data, activeDoc.name, unlockPassword);
      setDocument({
        ...activeDoc,
        data: unlockedBytes,
        size: unlockedBytes.byteLength,
      });
      alert('Document successfully decrypted!');
      onClose();
    } catch (err: any) {
      alert(`Decryption failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg">
              {mode === 'protect' ? <Lock className="w-5 h-5 text-brand-600" /> : <Unlock className="w-5 h-5 text-emerald-600" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {mode === 'protect' ? 'Protect & Encrypt PDF' : 'Unlock PDF Document'}
              </h3>
              <p className="text-xs text-slate-500">
                AES-256 password protection & permission restriction.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="px-6 pt-4 pb-2">
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs">
            <button
              onClick={() => setMode('protect')}
              className={`py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                mode === 'protect'
                  ? 'bg-white dark:bg-slate-900 text-brand-600 shadow-sm'
                  : 'text-slate-500'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Set Password</span>
            </button>
            <button
              onClick={() => setMode('unlock')}
              className={`py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                mode === 'unlock'
                  ? 'bg-white dark:bg-slate-900 text-brand-600 shadow-sm'
                  : 'text-slate-500'
              }`}
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>Unlock / Decrypt</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4 text-xs">
          {mode === 'protect' ? (
            <div className="space-y-3">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  User Password (Required to Open)
                </label>
                <input
                  type="password"
                  value={userPassword}
                  onChange={(e) => setUserPassword(e.target.value)}
                  placeholder="Enter open password..."
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Owner / Permissions Password (Optional)
                </label>
                <input
                  type="password"
                  value={ownerPassword}
                  onChange={(e) => setOwnerPassword(e.target.value)}
                  placeholder="Enter permissions password..."
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <span className="font-semibold text-slate-700 dark:text-slate-300 block">
                  Permissions
                </span>
                <label className="flex items-center gap-2 text-slate-600 dark:text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowPrinting}
                    onChange={(e) => setAllowPrinting(e.target.checked)}
                    className="rounded text-brand-600"
                  />
                  <span>Allow High-Resolution Printing</span>
                </label>
                <label className="flex items-center gap-2 text-slate-600 dark:text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowModifications}
                    onChange={(e) => setAllowModifications(e.target.checked)}
                    className="rounded text-brand-600"
                  />
                  <span>Allow Editing & Page Extraction</span>
                </label>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Document Password
                </label>
                <input
                  type="password"
                  value={unlockPassword}
                  onChange={(e) => setUnlockPassword(e.target.value)}
                  placeholder="Enter current password..."
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Entering the password removes security restrictions and saves an unencrypted copy.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-end gap-2 text-xs">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>

          {mode === 'protect' ? (
            <Button variant="primary" size="sm" onClick={handleProtect} disabled={isProcessing}>
              <Lock className="w-4 h-4 mr-1.5" />
              <span>{isProcessing ? 'Encrypting...' : 'Encrypt & Download'}</span>
            </Button>
          ) : (
            <Button variant="primary" size="sm" onClick={handleUnlock} disabled={isProcessing}>
              <Unlock className="w-4 h-4 mr-1.5" />
              <span>{isProcessing ? 'Decrypting...' : 'Unlock Document'}</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

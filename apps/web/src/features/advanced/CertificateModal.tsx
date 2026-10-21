import React, { useState, useEffect } from 'react';
import {
  FileCheck,
  ShieldCheck,
  KeyRound,
  AlertCircle,
  Loader2,
  X,
  Sparkles,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { useWorkspaceStore } from '../../store/workspaceStore';
import {
  verifyPdfSignatures,
  signDocumentPkcs12,
  generateDemoCertificate,
  VerificationResult,
} from './advancedClient';
import { Button } from '../../components/ui/Button';

export const CertificateModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { document: activeDoc, setDocument } = useWorkspaceStore();
  const [activeTab, setActiveTab] = useState<'verify' | 'sign'>('verify');

  // Verify State
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<VerificationResult | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  // Sign State
  const [p12File, setP12File] = useState<File | null>(null);
  const [p12Password, setP12Password] = useState('');
  const [reason, setReason] = useState('Certified compliant with Master_PDF');
  const [location, setLocation] = useState('Secure Workstation');
  const [isSigning, setIsSigning] = useState(false);
  const [signSuccess, setSignSuccess] = useState(false);
  const [signError, setSignError] = useState<string | null>(null);

  // Demo Cert Generation
  const [isGeneratingDemo, setIsGeneratingDemo] = useState(false);

  useEffect(() => {
    if (isOpen && activeDoc) {
      handleVerify();
    }
  }, [isOpen, activeDoc?.data]);

  const handleVerify = async () => {
    if (!activeDoc) return;
    setIsVerifying(true);
    setVerifyError(null);
    try {
      const res = await verifyPdfSignatures(activeDoc.data, activeDoc.name);
      setVerifyResult(res);
    } catch (err: any) {
      setVerifyError(err.message || 'Signature verification failed.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleGenerateDemoCert = async () => {
    setIsGeneratingDemo(true);
    try {
      const certBytes = await generateDemoCertificate('Alice Auditor', 'password123');
      const blob = new Blob([certBytes as unknown as BlobPart], { type: 'application/x-pkcs12' });
      const demoFile = new File([blob], 'demo_cert.pfx', { type: 'application/x-pkcs12' });
      setP12File(demoFile);
      setP12Password('password123');
      alert('Demo PKCS#12 certificate generated and loaded! Password is: password123');
    } catch (err: any) {
      alert(`Demo cert generation failed: ${err.message}`);
    } finally {
      setIsGeneratingDemo(false);
    }
  };

  const handleSign = async () => {
    if (!activeDoc || !p12File) {
      setSignError('Please upload or generate a PKCS#12 (.pfx/.p12) certificate file.');
      return;
    }

    setIsSigning(true);
    setSignError(null);
    setSignSuccess(false);

    try {
      const p12Buffer = await p12File.arrayBuffer();
      const signedBytes = await signDocumentPkcs12(
        activeDoc.data,
        activeDoc.name,
        new Uint8Array(p12Buffer),
        p12Password,
        reason,
        location
      );

      setDocument({
        ...activeDoc,
        name: activeDoc.name.replace(/\.[^/.]+$/, '') + '_signed.pdf',
        data: signedBytes,
        size: signedBytes.byteLength,
        lastModified: Date.now(),
      });

      setSignSuccess(true);
      // Refresh verification after signing
      handleVerify();
    } catch (err: any) {
      setSignError(err.message || 'Signing failed. Ensure the certificate password is correct.');
    } finally {
      setIsSigning(false);
    }
  };

  if (!isOpen || !activeDoc) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-50 dark:bg-purple-950/40 text-purple-600 rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Digital Signatures & PKCS#12
              </h2>
              <p className="text-xs text-slate-500">
                Cryptographic document verification and PKCS#12/PAdES certification.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 bg-slate-50/50 dark:bg-slate-900/40">
          <button
            onClick={() => setActiveTab('verify')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'verify'
                ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>Verify Signatures</span>
          </button>
          <button
            onClick={() => setActiveTab('sign')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'sign'
                ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Sign with Certificate (PKCS#12)</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'verify' ? (
            <div className="space-y-4">
              {isVerifying ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-500">
                  <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
                  <p className="text-xs font-medium">Validating cryptographic certificates...</p>
                </div>
              ) : verifyError ? (
                <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl flex items-center gap-2.5 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <span>{verifyError}</span>
                </div>
              ) : !verifyResult?.isSigned ? (
                <div className="py-10 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      No Digital Signatures Found
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      This document does not contain cryptographic X.509 signatures or digital certification seals.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab('sign')}
                    className="gap-1.5 text-xs"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Apply Digital Signature Now</span>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-xl flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300 font-semibold">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Document is Digitally Certified ({verifyResult.signatureCount} signature)</span>
                    </div>
                  </div>

                  {verifyResult.signatures.map((sig, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          {sig.signer}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700">
                          {sig.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-400 pt-1">
                        <div>Reason: <strong>{sig.reason}</strong></div>
                        <div>Location: <strong>{sig.location}</strong></div>
                        <div>Digest: <strong>{sig.digestAlgorithm}</strong></div>
                        <div>Timestamp: <strong>{sig.signingTime || 'Standard'}</strong></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Sign with PKCS#12 Tab */
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Certificate (.pfx / .p12)
                  </span>
                  <button
                    type="button"
                    onClick={handleGenerateDemoCert}
                    disabled={isGeneratingDemo}
                    className="text-xs font-medium text-brand-600 hover:underline flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>{isGeneratingDemo ? 'Generating...' : 'Generate Demo Cert'}</span>
                  </button>
                </div>
                <input
                  type="file"
                  accept=".pfx,.p12"
                  onChange={(e) => setP12File(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
                />
                {p12File && (
                  <div className="text-[11px] text-emerald-600 font-medium">
                    Loaded: {p12File.name} ({(p12File.size / 1024).toFixed(1)} KB)
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Certificate Password
                </label>
                <input
                  type="password"
                  placeholder="Enter certificate password..."
                  value={p12Password}
                  onChange={(e) => setP12Password(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Signing Reason
                  </label>
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Location
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>

              {signError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl flex items-center gap-2.5 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <span>{signError}</span>
                </div>
              )}

              {signSuccess && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-xl flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Document certified and digitally signed successfully!</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
          {activeTab === 'sign' && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleSign}
              disabled={isSigning || !p12File}
              className="gap-1.5 bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isSigning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing Document...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Apply Digital Signature</span>
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

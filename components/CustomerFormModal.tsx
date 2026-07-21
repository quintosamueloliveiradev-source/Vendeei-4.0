import React, { useState, useEffect } from 'react';
import { X, User, Phone, CreditCard } from 'lucide-react';
import { Customer } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, contact: string, cpf: string) => Promise<void>;
  editingCustomer?: Customer | null;
}

export const CustomerFormModal: React.FC<Props> = ({ isOpen, onClose, onSave, editingCustomer }) => {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [cpf, setCpf] = useState('');

  useEffect(() => {
    if (editingCustomer) {
      console.log('Editing customer:', editingCustomer);
      setName(editingCustomer.name || '');
      setContact(editingCustomer.contact || '');
      setCpf(editingCustomer.cpf || '');
    } else {
      console.log('New customer mode');
      setName('');
      setContact('');
      setCpf('');
    }
  }, [editingCustomer, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative">
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
        >
          <X size={20} />
        </button>
        <h3 className="text-lg font-bold text-slate-900 mb-6">{editingCustomer ? 'Editar Cliente' : 'Novo Cliente'}</h3>
        <form onSubmit={async (e) => {
          e.preventDefault();
          await onSave(name, contact, cpf);
        }} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[11px] text-slate-600 uppercase tracking-wider flex items-center gap-1.5 font-semibold">
              <User size={10} className="text-slate-400" /> Nome Completo
            </label>
            <div className="relative">
              <input 
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: João Silva Santos"
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium uppercase focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 focus:outline-none transition-all placeholder:text-slate-400 text-sm"
              />
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[11px] text-slate-600 uppercase tracking-wider flex items-center gap-1.5 font-semibold">
              <Phone size={10} className="text-slate-400" /> WhatsApp / Telefone
            </label>
            <div className="relative">
              <input 
                required
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="Ex: (11) 99999-9999"
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 focus:outline-none transition-all placeholder:text-slate-400 text-sm"
              />
              <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[11px] text-slate-600 uppercase tracking-wider flex items-center gap-1.5 font-semibold">
              <CreditCard size={10} className="text-slate-400" /> CPF
            </label>
            <div className="relative">
              <input 
                required
                value={cpf}
                onChange={(e) => setCpf(e.target.value)}
                placeholder="Ex: 000.000.000-00"
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-medium focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 focus:outline-none transition-all placeholder:text-slate-400 text-sm"
              />
              <CreditCard size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700"
            >
              Salvar Cliente
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

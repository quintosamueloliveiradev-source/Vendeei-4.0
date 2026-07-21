import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useStore } from '../context/StoreContext';
import { LogIn, UserPlus, Info, BarChart3, Store, ShieldCheck, Mail, Lock, Eye, EyeOff, Check, ArrowRight, Loader2, LogOut, LayoutDashboard, ShoppingCart, Package, Leaf, Hexagon, CircleDashed, SquareDashed, Sprout, Grid, ArrowUpRight, Sun, Home, Wheat, Layers, Coffee, Flame, Heart, ShoppingBag, Crown, Power, Zap } from 'lucide-react';
import { motion, animate, AnimatePresence } from 'motion/react';

const AnimatedCounter = ({ from, to, duration = 2, isCurrency = false, prefix = '', suffix = '', decimals = 0 }: { from: number, to: number, duration?: number, isCurrency?: boolean, prefix?: string, suffix?: string, decimals?: number }) => {
  const [value, setValue] = useState(from);

  useEffect(() => {
    const controls = animate(from, to, {
      duration,
      ease: "easeOut",
      onUpdate: (v) => setValue(v),
    });
    return () => controls.stop();
  }, [from, to, duration]);

  if (isCurrency) {
    return (
      <span>
        {prefix}{value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{suffix}
      </span>
    );
  }
  return <span>{prefix}{value.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}</span>;
};

const MarqueeLogos = () => {
  const logos = (
    <>
      {/* 1. pão & cia */}
      <div className="flex flex-col items-center justify-center grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all duration-300 w-32 h-20 shrink-0">
        <Wheat className="text-[#c17f4e] mb-1" size={24} strokeWidth={2} />
        <span className="font-serif font-bold text-[#5c3e2d] text-2xl tracking-tight leading-none mt-1">pão<span className="text-[#c17f4e]">&</span>cia</span>
        <span className="font-sans text-[#5c3e2d]/60 text-[0.45rem] font-bold tracking-[0.2em] uppercase mt-1">Padaria Artesanal</span>
      </div>

      {/* 2. fornatta */}
      <div className="flex flex-col items-center justify-center grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all duration-300 w-32 h-20 shrink-0">
        <div className="relative flex flex-col items-center mb-1">
          <div className="flex gap-0.5 mb-0.5 opacity-80">
            <div className="w-[1px] h-2 bg-[#4a3424] rotate-[-15deg] rounded-full"></div>
            <div className="w-[1.5px] h-2.5 bg-[#4a3424] rounded-full"></div>
            <div className="w-[1px] h-2 bg-[#4a3424] rotate-[15deg] rounded-full"></div>
          </div>
          <div className="w-8 h-4 border-t-2 border-l-2 border-r-2 border-[#4a3424] rounded-t-full bg-[#5c3e2d] flex justify-center items-end overflow-hidden pt-1">
             <div className="w-6 h-2 bg-[#3a2212] rounded-t-lg"></div>
          </div>
        </div>
        <span className="font-serif font-bold text-[#4a3424] text-2xl tracking-tight leading-none">fornatta</span>
        <span className="font-sans text-[#4a3424]/60 text-[0.45rem] font-bold tracking-[0.2em] uppercase mt-1">Padaria & Café</span>
      </div>

      {/* 3. Graniê */}
      <div className="flex flex-col items-center justify-center grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all duration-300 w-32 h-20 shrink-0 pl-2">
        <div className="flex items-start">
          <span className="font-serif text-[#4a3424] text-3xl tracking-tight leading-none">Graniê</span>
          <Wheat className="text-[#c19a4e] -ml-2 -mt-2 rotate-12" size={24} strokeWidth={2} />
        </div>
        <span className="font-sans text-[#4a3424]/60 text-[0.45rem] font-bold tracking-[0.2em] uppercase mt-1 text-center w-full">Pães Especiais</span>
      </div>

      {/* 4. levé */}
      <div className="flex flex-col items-center justify-center grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all duration-300 w-32 h-20 shrink-0">
        <Heart className="text-[#8c6b5d] mb-0.5" size={24} strokeWidth={1.5} />
        <span className="font-[cursive] text-[#4a3424] text-4xl leading-none">levé</span>
        <span className="font-sans text-[#4a3424]/60 text-[0.45rem] font-bold tracking-[0.2em] uppercase mt-1 text-center w-full">Padaria Saudável</span>
      </div>

      {/* 5. Bella Forno */}
      <div className="flex flex-col items-center justify-center grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all duration-300 w-32 h-20 shrink-0">
        <div className="relative flex justify-center items-end w-10 h-6 mb-1">
          <div className="absolute inset-0 border-t-4 border-l-4 border-r-4 border-[#3a2212] rounded-t-full"></div>
          <Flame className="text-[#f59e0b] fill-[#f59e0b] relative z-10 bottom-0" size={18} />
        </div>
        <span className="font-serif text-[#3a2212] text-2xl tracking-tight leading-none">Bella Forno</span>
        <span className="font-sans text-[#3a2212]/60 text-[0.45rem] font-bold tracking-[0.2em] uppercase mt-1 text-center w-full">Padaria Premium</span>
      </div>

      {/* 6. Açaí na tigela */}
      <div className="flex flex-col items-center justify-center grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all duration-300 w-32 h-20 shrink-0">
        <div className="flex items-center gap-0.5 -mb-2 z-10">
          <span className="font-sans font-black text-[#512b81] text-2xl italic pr-1">Açaí</span>
          <div className="flex text-[#4c9a2a]">
             <Leaf size={16} fill="currentColor" className="-rotate-45" />
             <Leaf size={12} fill="currentColor" className="mt-1" />
          </div>
        </div>
        <div className="flex items-center">
          <span className="font-sans font-medium text-[#512b81] text-lg tracking-tighter leading-none mt-2">na tigela</span>
          <div className="w-3 h-3 bg-[#512b81] rounded-full border-2 border-white -ml-0.5 mt-2"></div>
        </div>
        <span className="font-sans text-[#512b81]/70 text-[0.4rem] font-bold tracking-[0.2em] uppercase mt-1.5 text-center">Energia que conecta</span>
      </div>

      {/* 7. roots */}
      <div className="flex items-center justify-center grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all duration-300 w-32 h-20 shrink-0">
        <div className="flex flex-col items-center">
          <div className="flex items-center">
            <span className="font-sans font-black text-[#4b2c70] text-3xl tracking-tight leading-none">roots</span>
            <Leaf className="text-[#7bb03b] -ml-1 -mt-4 opacity-100" fill="currentColor" size={14} />
          </div>
          <span className="font-sans text-[#4b2c70]/60 text-[0.45rem] font-bold tracking-[0.15em] uppercase mt-1.5">Açaí & Superfoods</span>
        </div>
      </div>

      {/* 8. açaí vibe */}
      <div className="flex flex-col items-center justify-center grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all duration-300 w-32 h-20 shrink-0">
        <Sprout className="text-[#6baa3a] mb-0" size={20} strokeWidth={2.5} />
        <div className="flex items-end gap-1 -mt-1">
          <span className="font-sans font-black text-[#4b2c70] text-2xl tracking-tighter">açaí</span>
          <span className="font-[cursive] text-[#e6396f] text-2xl pb-1">vibe</span>
        </div>
        <span className="font-sans text-[#4b2c70]/70 text-[0.4rem] font-bold tracking-[0.2em] uppercase mt-0.5 whitespace-nowrap">Sabor • Energia • Vida</span>
      </div>

      {/* 9. puravida */}
      <div className="flex flex-col items-center justify-center grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all duration-300 w-32 h-20 shrink-0">
        <div className="flex flex-col items-center mb-1">
          <Leaf className="text-[#7bb03b]" size={16} fill="currentColor" />
          <div className="w-6 h-3 bg-[#512b81] rounded-b-full mt-0.5"></div>
        </div>
        <span className="font-sans font-medium text-[#512b81] text-2xl tracking-tight leading-none">puravida</span>
        <span className="font-sans text-[#512b81]/70 text-[0.4rem] font-bold tracking-[0.2em] uppercase mt-1">Açaí & Bem-Estar</span>
      </div>

      {/* 10. Açaí living */}
      <div className="flex flex-col items-center justify-center grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all duration-300 w-32 h-20 shrink-0">
        <div className="flex items-center gap-1">
          <span className="font-serif font-black text-[#4b2c70] text-2xl">Açaí</span>
          <span className="font-[cursive] text-[#7bb03b] text-3xl ml-1 mt-2">living</span>
        </div>
        <span className="font-sans text-[#4b2c70]/70 text-[0.4rem] font-bold tracking-[0.15em] uppercase mt-1">Natural como deve ser</span>
      </div>

      {/* 11. essenza */}
      <div className="flex flex-col items-center justify-center grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all duration-300 w-32 h-20 shrink-0">
        <div className="w-8 h-8 rounded-full border-[1.5px] border-slate-900 flex justify-center items-center mb-2">
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-slate-900" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 12c0-4.4 3.6-8 8-8s8 3.6 8-8-3.6 8-8 8H4M12 4v8h8"/></svg>
        </div>
        <span className="font-serif text-slate-900 text-xl tracking-wide leading-none">essenza</span>
        <span className="font-sans text-slate-500 text-[0.4rem] font-bold tracking-[0.2em] uppercase mt-1.5">Moda Feminina</span>
      </div>

      {/* 12. URBANNO */}
      <div className="flex flex-col items-center justify-center grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all duration-300 w-32 h-20 shrink-0">
        <div className="w-5 h-6 border-[2px] border-b-[4px] border-slate-900 rounded-b-lg mb-2 relative flex justify-center">
           <div className="w-2 h-4 border-b-[2px] border-x-[2px] border-slate-900 rounded-b-sm absolute bottom-0"></div>
        </div>
        <span className="font-sans font-black text-slate-900 text-lg tracking-[0.15em] leading-none mb-1 uppercase">Urbanno</span>
        <span className="font-sans text-slate-500 text-[0.4rem] font-bold tracking-[0.2em] uppercase">Moda Masculina</span>
      </div>

      {/* 13. lumina */}
      <div className="flex flex-col items-center justify-center grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all duration-300 w-32 h-20 shrink-0">
        <div className="flex items-center gap-0.5 justify-center mt-[-10px] mb-1 text-orange-400">
          <Sun size={12} fill="currentColor" strokeWidth={0} />
        </div>
        <span className="font-sans font-light text-slate-900 text-2xl tracking-[0.2em] leading-none text-center pl-1">lumina</span>
        <span className="font-sans text-slate-500 text-[0.4rem] font-bold tracking-[0.2em] uppercase mt-2">Moda que ilumina</span>
      </div>

      {/* 14. VÉRA */}
      <div className="flex flex-col items-center justify-center grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all duration-300 w-32 h-20 shrink-0">
        <span className="font-serif text-slate-900 text-3xl tracking-[0.15em] leading-none mb-1 pl-1">VÉRA</span>
        <span className="font-sans text-slate-500 text-[0.4rem] font-bold tracking-[0.2em] uppercase mt-1">Moda Autêntica</span>
      </div>

      {/* 15. mais que estilo */}
      <div className="flex flex-col items-center justify-center grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all duration-300 w-32 h-20 shrink-0">
        <div className="flex flex-col leading-none mb-1.5 items-center">
          <div className="flex items-center gap-1">
            <span className="font-serif text-slate-900 text-lg tracking-tight">mais</span>
            <Heart size={8} className="text-pink-500" fill="currentColor" strokeWidth={0} />
          </div>
          <span className="font-serif text-slate-900 text-xl tracking-tight -mt-1 font-bold">que estilo</span>
        </div>
        <span className="font-sans text-slate-500 text-[0.4rem] font-bold tracking-[0.2em] uppercase">Moda • Atitude • Você</span>
      </div>

      {/* 16. clickLar */}
      <div className="flex flex-col justify-center items-center grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all duration-300 w-32 h-20 shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <div className="relative">
            <Home className="text-[#0d2a5a]" size={26} strokeWidth={2} />
            <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-[#ff6b00] rounded-full border-2 border-white" />
          </div>
          <span className="font-sans font-normal text-[#0d2a5a] text-2xl tracking-tight leading-none pt-1">click<span className="font-bold text-[#ff6b00]">Lar</span></span>
        </div>
        <span className="font-sans text-[#0d2a5a]/50 text-[0.4rem] font-bold tracking-[0.15em] uppercase leading-none mt-1 w-full text-center">Tudo para sua casa</span>
      </div>

      {/* 17. mixstore */}
      <div className="flex flex-col items-center justify-center grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all duration-300 w-32 h-20 shrink-0">
        <ShoppingBag className="text-[#009e86] mb-1 relative z-10" size={24} strokeWidth={2.5} />
        <span className="font-sans font-bold text-[#204040] text-xl tracking-tight leading-none mb-1">mixstore</span>
        <span className="font-sans text-[#204040]/50 text-[0.4rem] font-bold tracking-[0.15em] uppercase leading-none w-full text-center">Tudo em um só lugar</span>
      </div>

      {/* 18. prime */}
      <div className="flex flex-col items-center justify-center grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all duration-300 w-32 h-20 shrink-0">
        <Crown className="text-[#f5a623] mb-1" size={24} strokeWidth={2.5} />
        <span className="font-serif font-black text-[#0d2a5a] text-2xl tracking-tight leading-none mb-1">prime</span>
        <span className="font-sans text-[#0d2a5a]/60 text-[0.4rem] font-bold tracking-[0.2em] uppercase leading-none text-center">Loja Premium</span>
      </div>

      {/* 19. achadinhos */}
      <div className="flex flex-col justify-center items-center grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all duration-300 w-32 h-20 shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 bg-[#eb1b5c] rounded-md flex justify-center items-center rounded-t-none border-t-4 border-[#eb1b5c]/50 relative">
             <Heart className="text-white" size={14} fill="currentColor" strokeWidth={0} />
             <div className="w-3 h-3 border-t-2 border-l-2 border-r-2 border-[#eb1b5c] rounded-t-full absolute -top-3.5"></div>
          </div>
          <span className="font-sans font-bold text-slate-900 text-xl tracking-tight leading-none">achadinhos</span>
        </div>
        <span className="font-sans text-slate-500 text-[0.4rem] font-bold tracking-[0.15em] uppercase leading-none w-full text-center">Da internet para você</span>
      </div>

      {/* 20. use & leve */}
      <div className="flex flex-col justify-center items-center grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all duration-300 w-32 h-20 shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <ShoppingBag className="text-[#0055c4] fill-[#0055c4]" size={26} strokeWidth={0} />
          <span className="font-sans font-medium text-[#0055c4] text-xl tracking-tight leading-none pt-1">use & leve</span>
        </div>
        <span className="font-sans text-[#0d2a5a]/50 text-[0.4rem] font-bold tracking-[0.15em] uppercase leading-none w-full text-center">Prático. Útil. Seu.</span>
      </div>

      {/* 21. techplus */}
      <div className="flex flex-col items-center justify-center grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all duration-300 w-32 h-20 shrink-0">
        <div className="flex gap-1.5 items-end mb-1">
          <div className="font-sans font-black text-[#0d2a5a] text-3xl leading-none flex">t<span className="text-[#0055c4] text-xl mb-3 leading-none">+</span></div>
          <span className="font-sans font-bold text-[#0d2a5a] text-xl tracking-tight leading-none -ml-0.5 pb-0.5">techplus</span>
        </div>
        <span className="font-sans text-[#0d2a5a]/50 text-[0.4rem] font-bold tracking-[0.15em] uppercase leading-none w-full text-center">Tecnologia para todos</span>
      </div>

      {/* 22. inova */}
      <div className="flex flex-col items-center justify-center grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all duration-300 w-32 h-20 shrink-0">
        <div className="flex items-center gap-0.5 mb-1">
          <span className="font-sans font-black text-slate-900 text-3xl tracking-tighter leading-none">in</span>
          <Power className="text-[#0055c4] mt-0.5 -mx-0.5" size={24} strokeWidth={3} />
          <span className="font-sans font-black text-slate-900 text-3xl tracking-tighter leading-none">va</span>
        </div>
        <span className="font-sans text-slate-500 text-[0.4rem] font-bold tracking-[0.2em] uppercase leading-none w-full text-center mt-1">Eletrônicos</span>
      </div>

      {/* 23. eletro smart */}
      <div className="flex flex-col items-center justify-center grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all duration-300 w-32 h-20 shrink-0">
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-8 h-8 rounded-full border-2 border-[#0055c4] flex items-center justify-center relative bg-white shrink-0">
            <Zap className="text-[#0055c4] rotate-90 ml-1" size={16} strokeWidth={3} fill="currentColor" />
            <div className="h-[2px] w-4 bg-[#0055c4] absolute -left-2 top-1/2 -mt-[1px]"></div>
          </div>
          <div className="flex flex-col leading-none gap-0.5">
             <span className="font-sans font-black text-[#0d2a5a] text-xl tracking-tight leading-none bg-clip-text">eletro</span>
             <span className="font-sans font-black text-[#0055c4] text-xl tracking-tight leading-none bg-clip-text">smart</span>
          </div>
        </div>
        <span className="font-sans text-[#0055c4]/60 text-[0.4rem] font-bold tracking-[0.2em] uppercase leading-none w-full text-center">Conectando você</span>
      </div>

      {/* 24. nextgen */}
      <div className="flex flex-col items-center justify-center grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all duration-300 w-32 h-20 shrink-0">
        <div className="flex items-center gap-1.5 mb-2">
          <div className="flex relative w-6 h-6 items-center justify-center">
            <div className="w-4 h-5 bg-[#9d4edd] rounded-[2px] rotate-45 mix-blend-multiply opacity-80 absolute text-center text-white flex justify-center text-[10px] items-center font-bold pb-1">&gt;</div>
            <div className="w-4 h-5 bg-[#e0aaff] rounded-[2px] -rotate-45 mix-blend-multiply opacity-80 absolute"></div>
          </div>
          <span className="font-sans font-medium text-slate-900 text-2xl tracking-tight leading-none pt-1">next<span className="font-bold text-[#7b2cbf]">gen</span></span>
        </div>
        <span className="font-sans text-slate-500 text-[0.4rem] font-bold tracking-[0.2em] uppercase leading-none w-full text-center">Eletrônicos</span>
      </div>

      {/* 25. bytec */}
      <div className="flex flex-col justify-center items-center grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all duration-300 w-32 h-20 shrink-0">
        <div className="flex items-center gap-1.5 mb-1 justify-center">
          <div className="text-[#00c9a7] font-extrabold text-4xl leading-none">b</div>
          <span className="font-sans font-black text-slate-900 text-2xl tracking-tight leading-none mt-1">bytec</span>
        </div>
        <span className="font-sans text-slate-400 text-[0.4rem] font-bold tracking-[0.2em] uppercase leading-none text-center">Tecnologia Inteligente</span>
      </div>
    </>
  );

  return (
    <div className="w-full bg-white border-t border-slate-200 py-6 relative z-20 overflow-hidden flex flex-col items-center">
      <p className="text-[13px] font-bold text-slate-400 mb-6 text-center z-10 w-full">
        +151 mil <span className="font-medium text-slate-400">histórias de crescimento começam com a Vendeei.</span>
      </p>
      <div className="relative w-full flex items-center h-[40px]">
        <div className="absolute left-0 top-0 bottom-0 w-16 md:w-48 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
        <div className="absolute right-0 top-0 bottom-0 w-16 md:w-48 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>
        
        <motion.div 
          animate={{ x: ["0%", "-50%"] }} 
          transition={{ repeat: Infinity, ease: "linear", duration: 40 }}
          className="flex items-center gap-16 md:gap-24 whitespace-nowrap min-w-max px-8"
        >
          {logos}
          {logos}
        </motion.div>
      </div>
    </div>
  );
};

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [storeName, setStoreName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { addToast, enterDemoMode } = useStore();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        if (password.length < 6) {
          throw new Error('A senha deve ter pelo menos 6 caracteres');
        }
        const { data: authData, error: authError } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: {
              full_name: fullName,
              store_name: storeName || 'Minha Loja'
            }
          }
        });
        if (authError) throw authError;

        // Manual store creation - with delay to allow database trigger to complete
        if (authData.user) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          // Store insertion
          const { error: storeError } = await supabase.from('stores').insert({
            user_id: authData.user.id,
            store_name: storeName || 'Minha Loja',
            whatsapp: '',
            is_open: true
          });
          if (storeError) {
             console.error('Erro detalhado ao criar loja:', storeError);
             throw new Error('Falha ao criar loja: ' + storeError.message);
          }
        }

        addToast('Conta criada com sucesso! Redirecionando...', 'success');
        navigate('/dashboard');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            throw new Error('E-mail ou senha incorretos');
          }
          throw error;
        }
        addToast('Bem-vindo de volta!', 'success');
        navigate('/dashboard');
      }
    } catch (err: any) {
      addToast(err.message || 'Erro na autenticação', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col relative overflow-hidden font-sans text-slate-800">
      
      {/* Decorative Background Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[80%] bg-emerald-100/40 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[70%] bg-blue-50/50 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="flex-1 flex w-full relative z-10">
        {/* LEFT COLUMN - Marketing (Hidden on Mobile) */}
        <div className="hidden lg:flex flex-col justify-center w-[55%] p-12 xl:p-24 relative z-10">
        
        <motion.div 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex items-center gap-3 mb-16"
        >
          <div className="bg-emerald-500 rounded-xl p-2.5 shadow-md shadow-emerald-500/20">
            <Store className="text-white" size={24} />
          </div>
          <span className="font-extrabold text-xl tracking-tight text-slate-800 font-vendeei">Vendeei</span>
        </motion.div>

        <div className="max-w-xl">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
            className="text-display-lg font-display-lg text-slate-800 mb-8"
          >
            Venda mais e gerencie<br />
            <span className="text-emerald-500">seu negócio melhor</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            className="text-slate-500 text-body-md font-body-md font-medium mb-12 max-w-lg leading-relaxed"
          >
            PDV ágil, controle de estoque e Catálogo Online integrado para 
            você vender muito mais direto pelo seu WhatsApp.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ duration: 0.8, delay: 0.3 }}
            className="space-y-8"
          >
            <div className="flex items-start gap-5">
              <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-slate-100 text-emerald-500 shrink-0">
                <Zap size={28} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="font-title-md font-bold text-slate-800 text-title-md mb-1">PDV Ágil</h3>
                <p className="text-slate-500 text-body-md font-body-md font-medium leading-snug">Vendas ultrarrápidas com interface intuitiva <br className="hidden xl:block"/> para evitar filas e burocracia.</p>
              </div>
            </div>

            <div className="flex items-start gap-5">
              <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-slate-100 text-emerald-500 shrink-0">
                <BarChart3 size={28} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="font-title-md font-bold text-slate-800 text-title-md mb-1">Gestão Inteligente</h3>
                <p className="text-slate-500 text-body-md font-body-md font-medium leading-snug">Relatórios automáticos e controle total <br className="hidden xl:block"/> para decisões baseadas em lucro real.</p>
              </div>
            </div>

            <div className="flex items-start gap-5">
              <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-slate-100 text-emerald-500 shrink-0">
                <ShoppingBag size={28} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="font-title-md font-bold text-slate-800 text-title-md mb-1">Catálogo Online</h3>
                <p className="text-slate-500 text-body-md font-body-md font-medium leading-snug">Sua vitrine digital na web para receber pedidos <br className="hidden xl:block"/> organizados direto no seu WhatsApp.</p>
              </div>
            </div>
            
            {/* Testimonial Card */}
            <div className="mt-8 bg-white/70 backdrop-blur-md border border-emerald-100 p-5 rounded-2xl shadow-lg shadow-emerald-500/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 -mt-2 -mr-2 text-emerald-100 group-hover:text-emerald-200 transition-colors">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" /></svg>
              </div>
              <div className="flex gap-1 text-amber-400 mb-3 relative z-10">
                 {[1, 2, 3, 4, 5].map((s) => (
                    <svg key={s} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                 ))}
              </div>
              <p className="text-slate-600 font-medium leading-relaxed mb-4 relative z-10 italic">
                 "O Vendeei transformou minha padaria. Antes eu perdia horas com o fluxo de caixa, hoje tenho tudo em tempo real na tela do celular."
              </p>
              <div className="flex items-center gap-3 relative z-10">
                 <img src="https://i.pravatar.cc/100?img=47" className="w-10 h-10 rounded-full border-2 border-white shadow-sm" alt="Ana Silva" />
                 <div>
                    <h4 className="font-bold text-slate-800 text-sm">Ana Silva</h4>
                    <p className="font-medium text-slate-500 text-xs">Proprietária da Pão & Cia</p>
                 </div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9, rotate: -8, y: 50, filter: "blur(10px)" }}
            animate={{ opacity: 1, scale: 1, rotate: -4, y: 0, filter: "blur(0px)" }}
            whileHover={{ rotate: -2, y: -5, scale: 1.02 }}
            transition={{ duration: 1, delay: 0.6, type: "spring", bounce: 0.3 }}
            className="mt-16 w-full max-w-[560px] h-[300px] bg-slate-50/90 rounded-[1.25rem] shadow-[0_30px_60px_-15px_rgba(16,185,129,0.3)] border border-white/50 flex overflow-hidden backdrop-blur-md origin-bottom-left relative z-20 cursor-default"
          >
            {/* Sidebar */}
            <div className="w-[72px] bg-[#0f3d2e] shrink-0 flex flex-col items-center py-6 gap-6 rounded-l-[1.25rem] border-r border-[#155440]">
              <div className="bg-emerald-500 rounded-xl p-2 text-white shadow-lg shadow-emerald-500/20"><Store size={20} /></div>
              <div className="w-6 h-px bg-white/20 mb-2"></div>
              <div className="bg-emerald-500 rounded-xl p-2 text-white shadow-lg shadow-emerald-500/20"><LayoutDashboard size={20} /></div>
              <div className="p-2 text-white/50 hover:text-white/80 transition-colors"><ShoppingCart size={20} /></div>
              <div className="p-2 text-white/50 hover:text-white/80 transition-colors"><Package size={20} /></div>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-5 bg-white/60 flex flex-col gap-4 relative overflow-hidden backdrop-blur-sm">
              {/* Cards */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-xl p-3.5 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col justify-between">
                  <p className="text-[11px] text-slate-500 font-bold mb-2">Vendas hoje</p>
                  <p className="text-base font-black text-slate-800 mb-2 tracking-tight">
                    <AnimatedCounter from={0} to={12540} duration={3} isCurrency={true} prefix="R$ " />
                  </p>
                  <div><span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                    +<AnimatedCounter from={0} to={12.5} duration={3} decimals={1} suffix="%" />
                  </span></div>
                </div>
                <div className="bg-white rounded-xl p-3.5 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col justify-between">
                  <p className="text-[11px] text-slate-500 font-bold mb-2">Pedidos</p>
                  <p className="text-base font-black text-slate-800 mb-2 tracking-tight">
                    <AnimatedCounter from={0} to={156} duration={3} />
                  </p>
                  <div><span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                    +<AnimatedCounter from={0} to={8.2} duration={3} decimals={1} suffix="%" />
                  </span></div>
                </div>
                <div className="bg-white rounded-xl p-3.5 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col justify-between">
                  <p className="text-[11px] text-slate-500 font-bold mb-2">Ticket médio</p>
                  <p className="text-base font-black text-slate-800 mb-2 tracking-tight">
                    <AnimatedCounter from={0} to={85.20} duration={3} isCurrency={true} prefix="R$ " />
                  </p>
                  <div><span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                    +<AnimatedCounter from={0} to={5.7} duration={3} decimals={1} suffix="%" />
                  </span></div>
                </div>
              </div>

              {/* Chart Area */}
              <div className="bg-white rounded-xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] border border-slate-100 flex-1 relative overflow-hidden flex items-end pb-0">
                {/* SVG Graph */}
                <svg className="w-full h-full absolute inset-x-0 bottom-0 preserve-aspect-ratio-none" viewBox="0 0 100 40" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.01" />
                    </linearGradient>
                  </defs>
                  
                  {/* Fill */}
                  <motion.path 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1.5, delay: 0.8 }}
                    d="M0,35 L5,32 L15,22 L20,25 L25,23 L35,28 L40,24 L50,26 L60,18 L68,22 L75,17 L85,6 L95,12 L100,8 L100,40 L0,40 Z" fill="url(#chart-grad)"
                  />
                  
                  {/* Stroke animated */}
                  <motion.path 
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 2.5, ease: "easeOut", delay: 0.8 }}
                    d="M0,35 L5,32 L15,22 L20,25 L25,23 L35,28 L40,24 L50,26 L60,18 L68,22 L75,17 L85,6 L95,12 L100,8" 
                    fill="none" stroke="#10b981" strokeWidth="1.5" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" 
                  />
                </svg>
              </div>
            </div>
          </motion.div>

        </div>
      </div>

      {/* RIGHT COLUMN - Auth Form */}
      <div className="w-full lg:w-[45%] flex flex-col items-center justify-center p-6 sm:p-12 relative z-10">
        
        {/* Only show logo on mobile, hidden on desktop since it's on the left */}
        <div className="lg:hidden flex items-center gap-2 mb-10 w-full max-w-md">
          <div className="bg-emerald-500 rounded-xl p-2 w-10 h-10 flex items-center justify-center shadow-md">
            <Store className="text-white" size={20} />
          </div>
          <span className="font-extrabold text-xl tracking-tight text-slate-800 font-vendeei">Vendeei</span>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }} 
          transition={{ duration: 0.5, type: "spring", bounce: 0.4 }}
          className="w-full max-w-[460px] bg-white rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-slate-100/60 p-8 sm:p-12"
        >
          {/* Logo inside card (optional, mimicking the design image) */}
          <div className="flex justify-center mb-6">
            <div className="bg-emerald-500 rounded-[1.25rem] p-4 shadow-lg shadow-emerald-500/20">
              <Store className="text-white" size={32} />
            </div>
          </div>
          
          <div className="text-center mb-8">
             <h2 className="text-[1.75rem] font-black text-slate-800 tracking-tight leading-none mb-3 font-vendeei">Vendeei</h2>
             <p className="text-slate-500 font-medium">Acesse sua conta para continuar</p>
          </div>

          <form onSubmit={handleAuth} className="space-y-5">
            <AnimatePresence mode="popLayout">
              {isSignUp && (
                <motion.div
                  initial={{ opacity: 0, height: 0, scale: 0.95 }}
                  animate={{ opacity: 1, height: 'auto', scale: 1 }}
                  exit={{ opacity: 0, height: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-5 overflow-hidden"
                >
                  <div className="pt-2">
                    <label className="block text-sm font-bold text-slate-700 mb-2">Nome completo</label>
                    <div className="relative group">
                      <UserPlus className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
                      <input 
                        type="text" 
                        required={isSignUp}
                        placeholder="João da Silva"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full pl-11 pr-4 py-3.5 bg-white border-2 border-slate-200 focus:border-emerald-500 rounded-xl outline-none font-medium text-slate-700 placeholder:text-slate-400 focus:ring-4 focus:ring-emerald-500/10 transition-all font-sans"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Nome da Loja</label>
                    <div className="relative group">
                      <Store className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
                      <input 
                        type="text" 
                        required={isSignUp}
                        placeholder="Minha Loja"
                        value={storeName}
                        onChange={(e) => setStoreName(e.target.value)}
                        className="w-full pl-11 pr-4 py-3.5 bg-white border-2 border-slate-200 focus:border-emerald-500 rounded-xl outline-none font-medium text-slate-700 placeholder:text-slate-400 focus:ring-4 focus:ring-emerald-500/10 transition-all font-sans"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">E-mail</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
                <input 
                  type="email" 
                  required
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-white border-2 border-slate-200 focus:border-emerald-500 rounded-xl outline-none font-medium text-slate-700 placeholder:text-slate-400 focus:ring-4 focus:ring-emerald-500/10 transition-all font-sans"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Senha</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
                <input 
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-12 py-3.5 bg-white border-2 border-slate-200 focus:border-emerald-500 rounded-xl outline-none font-medium text-slate-700 placeholder:text-slate-400 focus:ring-4 focus:ring-emerald-500/10 transition-all font-sans tracking-wide"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              <AnimatePresence>
                {isSignUp && password.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3"
                  >
                    <div className="flex gap-1.5 mb-2">
                      <div className={`h-1.5 flex-1 rounded-full ${password.length >= 4 ? 'bg-red-500' : 'bg-slate-200'} transition-colors`}></div>
                      <div className={`h-1.5 flex-1 rounded-full ${password.length >= 6 ? 'bg-amber-500' : 'bg-slate-200'} transition-colors`}></div>
                      <div className={`h-1.5 flex-1 rounded-full ${password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password) ? 'bg-emerald-500' : 'bg-slate-200'} transition-colors`}></div>
                    </div>
                    <span className="text-xs font-semibold text-slate-500">
                      {password.length < 6 ? 'Muito curta' : (password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password) ? 'Forte' : 'Razoável')}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex items-center justify-center">
                  <input type="checkbox" className="peer sr-only" defaultChecked />
                  <div className="w-5 h-5 border-2 border-slate-300 rounded group-hover:border-emerald-500 peer-checked:border-emerald-500 peer-checked:bg-emerald-500 transition-all flex items-center justify-center">
                    <Check size={14} className="text-white opacity-0 peer-checked:opacity-100" strokeWidth={3} />
                  </div>
                </div>
                <span className="text-sm font-medium text-slate-600 select-none">Lembrar de mim</span>
              </label>

              <button type="button" onClick={() => addToast('Redefinição de senha em fase de testes. Tente novamente mais tarde.', 'info')} className="text-sm font-bold text-emerald-500 hover:text-emerald-600 transition-colors">
                Esqueci minha senha
              </button>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className={`w-full py-4 mt-2 rounded-xl font-bold text-white shadow-lg transition-all flex justify-center items-center gap-2 group
                ${loading ? 'bg-slate-400 cursor-not-allowed shadow-none' : 'bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] shadow-emerald-500/25 hover:shadow-emerald-500/40'}
              `}
            >
              {loading ? <Loader2 className="animate-spin" size={22} /> : (isSignUp ? 'Começar agora gratuitamente' : 'Entrar no Sistema')}
              {!loading && !isSignUp && <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />}
              {!loading && isSignUp && <Zap size={20} />}
            </button>

            <div className="relative flex items-center gap-4 my-8">
              <div className="h-px bg-slate-200 flex-1"></div>
              <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">ou</span>
              <div className="h-px bg-slate-200 flex-1"></div>
            </div>

            <button 
              type="button" 
              onClick={() => addToast('Login via Google será habilitado em breve.', 'info')}
              className="w-full bg-white border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 active:bg-slate-100 text-slate-700 font-bold py-3.5 rounded-xl transition-all flex justify-center items-center gap-3"
            >
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-[18px] h-[18px]" />
              Entrar com Google
            </button>

            <button 
              type="button" 
              onClick={enterDemoMode}
              className="w-full mt-4 bg-emerald-50 hover:bg-emerald-100/80 active:bg-emerald-200/50 text-emerald-700 font-bold py-3.5 rounded-xl transition-all flex justify-center items-center gap-2.5 border-2 border-emerald-100 shadow-sm"
            >
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Acessar Modo de Demonstração
            </button>

            <div className="text-center pt-2">
              <p className="text-[15px] font-medium text-slate-600">
                {isSignUp ? 'Já tem uma conta?' : 'Não tem conta?'}{' '}
                <button 
                  type="button" 
                  onClick={() => setIsSignUp(!isSignUp)} 
                  className="text-emerald-500 font-bold hover:text-emerald-600 transition-colors"
                >
                  {isSignUp ? 'Entre agora' : 'Cadastre-se por R$ 14,90/mês'}
                </button>
              </p>
            </div>

          </form>
        </motion.div>

        {/* Info Banner */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-8 max-w-[460px] w-full bg-[#f0f4f8] border border-slate-200/60 rounded-2xl p-4 flex gap-3 text-blue-800 text-sm shadow-sm"
        >
          <Info size={20} className="shrink-0 mt-0.5 text-blue-600" />
          <p className="leading-relaxed">O primeiro acesso cria um período de <span className="font-bold">7 dias de teste grátis</span>. Após isso, a assinatura é necessária.</p>
        </motion.div>

        {/* Footer Text */}
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-12 text-slate-400 text-[13px] font-medium tracking-wide"
        >
          © 2024 Vendeei. Todos os direitos reservados.
        </motion.div>

      </div>
      </div>
      
      <MarqueeLogos />
    </div>
  );
};


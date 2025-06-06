'use client';

import { AlertMessage } from '@/components/ui/AlertMessage';
import { FloatingActionButton } from '@/components/ui/cadastros/FloatingActionButton';
import { ConfirmDeleteModal } from '@/components/ui/cadastros/modais_cadastros/ConfirmDeleteModal';
import { EspecificacoesModal } from '@/components/ui/cadastros/modais_cadastros/EspecificacoesModal';
import { OperacoesModal } from '@/components/ui/cadastros/modais_cadastros/OperacoesModal';
import { OperacaoSelectionModal } from '@/components/ui/cadastros/OperacaoSelectionModal';
import { PageHeader } from '@/components/ui/cadastros/PageHeader';
import { Tooltip } from '@/components/ui/cadastros/Tooltip';
import { RestrictedAccess } from "@/components/ui/RestrictedAccess";
import { atualizarOrdemEspecificacoes, deleteEspecificacaoInspecao } from '@/services/api/especificacaoService';
import { deleteOperacaoProcesso, getProcessoDetalhes } from '@/services/api/processoService';
import { AlertState } from '@/types/cadastros/especificacao';
import { EspecificacaoInspecao, OperacaoProcesso, ProcessoDetalhes } from '@/types/cadastros/processo';
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, ArrowDown, ArrowLeft, ArrowUp, Check, Clock, ListFilter, Pencil, Ruler, Trash2 } from "lucide-react";
import { useRouter, useSearchParams } from 'next/navigation';
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import './reordering-styles.css';

// Componente para card de especificação
interface EspecificacaoCardProps {
    especificacao: EspecificacaoInspecao;
    onEdit?: (especificacao: EspecificacaoInspecao) => void;
    onDelete?: (especificacao: EspecificacaoInspecao) => void;
    isReordering?: boolean;
    onMoveUp?: (index: number) => void;
    onMoveDown?: (index: number) => void;
    index?: number;
    isLastItem?: boolean;
}

// Define the component first, then memoize it with explicit equality check
const EspecificacaoCardBase = ({
    especificacao,
    onEdit,
    onDelete,
    isReordering = false,
    onMoveUp,
    onMoveDown,
    index = 0,
    isLastItem = false
}: EspecificacaoCardProps) => {
    // Estado local para controlar animações de movimentação
    const [moveAnimation, setMoveAnimation] = useState<'up' | 'down' | null>(null);

    // Função para tratar a animação quando o item é movido para cima
    const handleMoveUp = useCallback(() => {
        if (!onMoveUp || !isReordering) return;

        // Define a animação
        setMoveAnimation('up');

        // Chama a função de movimentação
        onMoveUp(index);

        // Remove a classe de animação após ela terminar
        setTimeout(() => {
            setMoveAnimation(null);
        }, 300); // Duração da animação CSS
    }, [onMoveUp, index, isReordering]);    // Função para tratar a animação quando o item é movido para baixo
    const handleMoveDown = useCallback(() => {
        if (!onMoveDown || !isReordering || isLastItem) return;

        // Define a animação
        setMoveAnimation('down');

        // Chama a função de movimentação
        onMoveDown(index);

        // Remove a classe de animação após ela terminar
        setTimeout(() => {
            setMoveAnimation(null);
        }, 300); // Duração da animação CSS
    }, [onMoveDown, index, isReordering, isLastItem]);

    const renderSVG = useCallback((svgString: string | undefined) => {
        if (!svgString) return (
            <div className="w-9 h-9 flex items-center justify-center mx-auto">
                <span className="text-gray-400 text-xs font-medium"> </span>
            </div>
        );
        return (
            <div
                dangerouslySetInnerHTML={{ __html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${svgString}</svg>` }}
                className="w-9 h-9 mx-auto"
                style={{
                    filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.12))',
                    transform: 'scale(1.3)'
                }}
            />
        );
    }, []);    // Função para obter nome completo do tipo de valor
    const getTipoValorDescricao = useCallback(() => {
        switch (especificacao.tipo_valor) {
            case 'F': return 'Faixa';
            case 'U': return 'Único';
            case 'A': return 'Aprovado/Reprovado';
            case 'C': return 'Conforme/Não Conforme';
            case 'S': return 'Sim/Não';
            case 'L': return 'Liberado/Retido';
            default: return especificacao.tipo_valor;
        }
    }, [especificacao.tipo_valor]);    // Função para renderizar valores conforme o tipo
    const renderValor = useCallback(() => {
        switch (especificacao.tipo_valor) {
            case 'F':
                return `${especificacao.valor_minimo} a ${especificacao.valor_maximo} ${especificacao.unidade_medida}`;
            case 'U':
                return `${especificacao.valor_maximo} ${especificacao.unidade_medida}`;
            case 'A': return 'Aprovado/Reprovado';
            case 'C': return 'Conforme/Não Conforme';
            case 'S': return 'Sim/Não';
            case 'L': return 'Liberado/Retido';
            default:
                return '';
        }
    }, [
        especificacao.tipo_valor,
        especificacao.valor_minimo,
        especificacao.valor_maximo,
        especificacao.unidade_medida
    ]);
    const renderCotaSeguranca = useCallback(() => {
        if (!especificacao.cota_seguranca || especificacao.cota_seguranca !== 'S') return null;

        return (
            <div className="flex items-center mt-2 gap-1 bg-blue-50 border border-blue-100 rounded-md px-2 py-1">
                <svg className="w-3.5 h-3.5 text-blue-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 0118 10c0 6.627-5.373 12-12 12S0 16.627 0 10c0-3.865 1.85-7.3 4.72-9.467l-3.08-1.96L12 1.944zm6.857 8.053L12.293 16l-3.293-3.293a1 1 0 011.414-1.414L12 12.877l3.443-3.443a1 1 0 111.414 1.414z" clipRule="evenodd" />
                </svg>
                <span className="text-xs text-blue-700 font-medium">Cota de Segurança</span>
            </div>
        );
    }, [especificacao.cota_seguranca]);
    const renderUsoIndicator = useCallback((value: string, label: string) => {
        const isActive = value === 'S';
        return (
            <div className="flex flex-col items-center">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shadow-sm                    ${isActive ? 'bg-[#1ABC9C] text-white' : 'bg-gray-100 text-gray-300'}`}
                >
                    {isActive ? (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                    ) : (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    )}
                </div>
                <span className="text-[10px] font-medium mt-1 text-gray-600">{label}</span>
            </div>
        );
    }, []);

    // Determinar as classes CSS para animação
    const animationClass = moveAnimation === 'up'
        ? 'move-up-animation'
        : moveAnimation === 'down'
            ? 'move-down-animation'
            : '';

    return (
        <tr className={`transition-all duration-200 border-b border-gray-100 ${isReordering ? 'bg-blue-50/30 hover:bg-blue-100/40 hover:-translate-y-0.5 hover:shadow-md' : 'hover:bg-blue-50/30'} ${animationClass}`}>
            <td className="py-4 text-center">
                <div className="flex justify-center">
                    <span className={`w-7 h-7 rounded-full ${isReordering ? 'bg-blue-200 text-blue-800 border border-blue-400' : 'bg-blue-100 text-blue-800'} font-medium text-xs flex items-center justify-center transition-all`}>
                        {especificacao.ordem}
                    </span>
                </div>
            </td>
            <td className="py-4">
                <div className="flex justify-center">
                    <div className="w-11 h-11 flex items-center justify-center" style={{ margin: '-4px 0' }}>
                        {renderSVG(especificacao.svg_cota)}
                    </div>
                </div>
            </td>
            <td className="px-4 py-4">
                <div className="flex flex-col">
                    <div className="flex items-center">
                        <span className="font-medium text-gray-800 text-sm">
                            {especificacao.especificacao_cota}
                        </span>
                    </div>
                    {especificacao.complemento_cota && (
                        <div className="mt-1.5">
                            <span className="text-xs text-gray-500">
                                {especificacao.complemento_cota}
                            </span>
                        </div>
                    )}
                </div>
            </td>
            <td className="py-4">
                <div className="flex justify-center">
                    {especificacao.svg_caracteristica ? (
                        <div className="w-11 h-11 flex items-center justify-center" style={{ margin: '-4px 0' }}>
                            <div
                                dangerouslySetInnerHTML={{ __html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${especificacao.svg_caracteristica}</svg>` }}
                                className="w-full h-full"
                                style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.12))' }}
                            />
                        </div>
                    ) : (
                        <div className="w-9 h-9 flex items-center justify-center">
                            <span className="text-gray-600 text-md">----</span>
                        </div>
                    )}
                </div>
            </td>
            <td className="px-4 py-4">
                <div className="flex flex-col gap-1.5">
                    <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded-md text-xs inline-flex items-center">
                        <Ruler className="h-3 w-3 mr-1.5" />
                        <span className="font-medium">{especificacao.tipo_instrumento}</span>
                    </span>
                    {especificacao.especificacao_caracteristica && (
                        <span className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded-md flex items-center">
                            <span className="w-1 h-1 bg-gray-400 rounded-full mr-1.5"></span>
                            {especificacao.especificacao_caracteristica}
                        </span>
                    )}
                </div>
            </td>
            <td className="px-4 py-4">
                <div className="flex flex-col gap-2">
                    <div className="text-xs bg-gray-50 rounded-md px-3 py-1.5 flex items-center">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-1.5"></span>
                        <span className="text-gray-800 font-medium">{getTipoValorDescricao()}</span>
                    </div>
                    {!['A', 'C', 'S', 'L'].includes(especificacao.tipo_valor) && (
                        <div className="text-xs text-gray-800 font-medium bg-yellow-50 border border-yellow-100 px-3 py-1.5 rounded-md flex items-center shadow-sm">
                            <span className="w-2 h-2 bg-yellow-400 rounded-full mr-1.5"></span>
                            {renderValor()}
                        </div>
                    )}
                    {especificacao.cota_seguranca === 'S' && renderCotaSeguranca()}
                </div>
            </td>
            <td className="py-4">
                <div className="flex justify-center">
                    {renderUsoIndicator(especificacao.uso_inspecao_setup, 'Setup')}
                </div>
            </td>
            <td className="py-4">
                <div className="flex justify-center">
                    {renderUsoIndicator(especificacao.uso_inspecao_qualidade, 'Qualidade')}
                </div>
            </td>
            <td className="py-4">
                <div className="flex justify-center">
                    {renderUsoIndicator(especificacao.uso_inspecao_processo, 'Processo')}
                </div>
            </td>
            <td className="py-4">
                <div className="flex items-center justify-center gap-2">
                    {isReordering ? (
                        <div className="flex items-center gap-2">                            <Tooltip text="Mover para cima">
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={handleMoveUp}
                                className={`p-1.5 rounded-md ${index === 0 ? 'text-blue-300 cursor-not-allowed' : 'text-blue-600 hover:bg-blue-50'} transition-colors`}
                                disabled={index === 0}
                            >
                                <ArrowUp className="h-4 w-4" />
                            </motion.button>
                        </Tooltip>
                            <Tooltip text="Mover para baixo">
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleMoveDown}
                                    className={`p-1.5 rounded-md ${isLastItem ? 'text-blue-300 cursor-not-allowed' : 'text-blue-600 hover:bg-blue-50'} transition-colors`}
                                    disabled={isLastItem}
                                >
                                    <ArrowDown className="h-4 w-4" />
                                </motion.button>
                            </Tooltip>
                        </div>
                    ) : (
                        <>
                            <Tooltip text="Editar">
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => onEdit && onEdit(especificacao)}
                                    className="p-2 rounded-md text-gray-700 hover:text-yellow-600 hover:bg-yellow-50 transition-colors"
                                >
                                    <Pencil className="h-4 w-4" />
                                </motion.button>
                            </Tooltip>
                            <Tooltip text="Excluir">
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => onDelete && onDelete(especificacao)}
                                    className="p-2 rounded-md text-gray-700 hover:text-red-600 hover:bg-red-50 transition-colors"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </motion.button>
                            </Tooltip>
                        </>
                    )}
                </div>
            </td>
        </tr>
    );
};

// Custom equality function for EspecificacaoCard component
const arePropsEqual = (prevProps: EspecificacaoCardProps, nextProps: EspecificacaoCardProps) => {
    // Compare todos os campos relevantes que possam mudar durante uma edição
    return (
        prevProps.especificacao.id === nextProps.especificacao.id &&
        prevProps.especificacao.ordem === nextProps.especificacao.ordem &&
        prevProps.especificacao.tipo_valor === nextProps.especificacao.tipo_valor &&
        prevProps.especificacao.valor_minimo === nextProps.especificacao.valor_minimo &&
        prevProps.especificacao.valor_maximo === nextProps.especificacao.valor_maximo &&
        prevProps.especificacao.unidade_medida === nextProps.especificacao.unidade_medida &&
        prevProps.especificacao.id_caracteristica_especial === nextProps.especificacao.id_caracteristica_especial &&
        prevProps.especificacao.uso_inspecao_setup === nextProps.especificacao.uso_inspecao_setup &&
        prevProps.especificacao.uso_inspecao_processo === nextProps.especificacao.uso_inspecao_processo &&
        prevProps.especificacao.uso_inspecao_qualidade === nextProps.especificacao.uso_inspecao_qualidade &&
        prevProps.isReordering === nextProps.isReordering &&
        prevProps.index === nextProps.index &&
        prevProps.isLastItem === nextProps.isLastItem
        // Não comparando callbacks que devem ser memoizados pelo componente pai
    );
};

// Create the memoized version of the component
const EspecificacaoCard = memo(EspecificacaoCardBase, arePropsEqual);

// Componente para mostrar uma operação e suas especificações
interface OperacaoSectionProps {
    operacao: OperacaoProcesso;
    initialExpanded?: boolean;
    referencia: string;
    roteiro: string;
    processo: string;
    onReorder: (newOrder: EspecificacaoInspecao[]) => Promise<void>;
    onAlert: (message: string, type: "success" | "error") => void;
    onRefresh: () => Promise<void>;
    onEdit?: (operacao: OperacaoProcesso) => void;
    onDelete?: (operacao: OperacaoProcesso) => void;
    onModalChange?: (operacaoId: number, modalType: 'spec' | 'deleteSpec', isOpen: boolean) => void;
}

const OperacaoSection = ({
    operacao,
    initialExpanded = false,
    referencia,
    roteiro,
    processo,
    onReorder,
    onAlert,
    onRefresh,
    onEdit,
    onDelete,
    onModalChange
}: OperacaoSectionProps): React.ReactNode => {
    const [isExpanded, setIsExpanded] = useState<boolean>(initialExpanded);
    const [isSpecModalOpen, setIsSpecModalOpen] = useState(false);
    const [selectedSpec, setSelectedSpec] = useState<EspecificacaoInspecao | null>(null);
    const [isReordering, setIsReordering] = useState(false); const [isDeleteSpecModalOpen, setIsDeleteSpecModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [especificacoes, setEspecificacoes] = useState<EspecificacaoInspecao[]>(
        operacao.especificacoes_inspecao || []
    );
    const [isSaving, setIsSaving] = useState(false);
    useEffect(() => {
        // Só atualiza quando não estiver no modo de reordenação
        if (!isReordering) {
            setEspecificacoes(operacao.especificacoes_inspecao || []);
        }
    }, [operacao.especificacoes_inspecao, isReordering]);

    // Garante que o estado local seja sempre atualizado quando os dados da operação mudarem - mas não durante reordenação
    useEffect(() => {
        if (!isReordering && JSON.stringify(operacao.especificacoes_inspecao) !== JSON.stringify(especificacoes)) {
            console.log('Atualizando especificações:', operacao.id_operacao);
            setEspecificacoes(operacao.especificacoes_inspecao || []);
        }
    }, [operacao.especificacoes_inspecao, operacao.id_operacao, especificacoes, isReordering]);

    // Memoized value for especificacoesCount to avoid re-calculations
    const especificacoesCountValue = useMemo(() => especificacoes.length || 0, [especificacoes]);

    // Função para alternar expansão
    const toggleExpand = useCallback(() => {
        setIsExpanded(prev => !prev);
    }, []);    // Função aprimorada para mover especificação para cima - com prevenção de React state updates
    const moveSpecUp = useCallback((index: number) => {
        if (index <= 0) return; // Não faz nada se for o primeiro item

        // Atualização imediata do estado com persistência
        setEspecificacoes(prev => {
            const newOrder = [...prev].map(item => ({ ...item })); // Cópia profunda de todos os objetos

            // Criando uma cópia dos objetos para garantir que React detecte as mudanças
            const itemMoving = newOrder[index];
            const itemReplacing = newOrder[index - 1];

            // Troca a propriedade de ordem visualmente 
            const tempOrdem = itemMoving.ordem;
            itemMoving.ordem = itemReplacing.ordem;
            itemReplacing.ordem = tempOrdem;

            // Troca a posição no array
            newOrder.splice(index, 1);
            newOrder.splice(index - 1, 0, itemMoving);

            // Console para debug
            console.log("Movendo item para cima:", itemMoving.id, "Nova ordem:", newOrder.map(e => e.ordem));

            return newOrder;
        });
    }, []);

    // Função aprimorada para mover especificação para baixo - com prevenção de React state updates
    const moveSpecDown = useCallback((index: number) => {
        if (index >= especificacoes.length - 1) return; // Não faz nada se for o último item

        setEspecificacoes(prev => {
            const newOrder = [...prev].map(item => ({ ...item })); // Cópia profunda de todos os objetos

            // Criando uma cópia dos objetos para garantir que React detecte as mudanças
            const itemMoving = newOrder[index];
            const itemReplacing = newOrder[index + 1];

            // Troca a propriedade de ordem visualmente 
            const tempOrdem = itemMoving.ordem;
            itemMoving.ordem = itemReplacing.ordem;
            itemReplacing.ordem = tempOrdem;

            // Troca a posição no array usando splice para garantir a reordenação
            newOrder.splice(index, 1);
            newOrder.splice(index + 1, 0, itemMoving);

            // Console para debug
            console.log("Movendo item para baixo:", itemMoving.id, "Nova ordem:", newOrder.map(e => e.ordem));

            return newOrder;
        });
    }, [especificacoes.length]); const handleReorder = useCallback(async () => {
        if (!isReordering || !especificacoes.length) return;

        try {
            setIsSaving(true);
            console.log("Salvando nova ordem de especificações");

            // Prepara os dados para enviar à API com ordem sequencial começando de 1
            // Mantém todos os campos originais e atualiza apenas a ordem
            const updatedEspecificacoes = especificacoes.map((esp, index) => {
                // Cópia profunda do objeto para evitar referências
                const updatedEsp = { ...esp };
                // Atualiza a ordem com base na posição atual no array
                updatedEsp.ordem = index + 1;
                return updatedEsp;
            });

            // Log para debug
            console.log("Nova sequência para salvar:",
                updatedEspecificacoes.map(esp => `ID ${esp.id}: ordem ${esp.ordem}`).join(', '));

            // Envia a nova ordem para a API
            await onReorder(updatedEspecificacoes);
            onAlert("Ordem das especificações atualizada com sucesso!", "success");

            // Força atualização do estado local para refletir a nova ordem
            setEspecificacoes(updatedEspecificacoes);

            // Só depois desativa o modo de reordenação
            setIsReordering(false);
        } catch (error) {
            console.error('Erro ao atualizar ordem:', error);
            onAlert("Erro ao atualizar a ordem das especificações", "error");
        } finally {
            setIsSaving(false);
        }
    }, [isReordering, especificacoes, onReorder, onAlert]); const handleEditSpec = useCallback((spec: EspecificacaoInspecao) => {
        console.log('Enviando para edição - COMPLETO:', spec);

        // Criar uma versão completa do objeto que inclui o campo caracteristica_especial
        const completeSpec = {
            ...spec,
            caracteristica_especial: spec.especificacao_caracteristica
        };

        setSelectedSpec(completeSpec);
        setIsSpecModalOpen(true);
        onModalChange?.(operacao.id_operacao, 'spec', true);
    }, [operacao.id_operacao, onModalChange]);

    // Handler para excluir especificação
    const handleDeleteSpec = useCallback((spec: EspecificacaoInspecao) => {
        setSelectedSpec(spec);
        setIsDeleteSpecModalOpen(true);
        onModalChange?.(operacao.id_operacao, 'deleteSpec', true);
    }, [operacao.id_operacao, onModalChange]);
    const confirmDeleteSpec = useCallback(async () => {
        if (!selectedSpec) return;
        setIsDeleting(true); try {
            await deleteEspecificacaoInspecao(selectedSpec.id);
            onAlert("Especificação excluída com sucesso!", "success");
            onRefresh();
        } catch (error) {
            console.error('Erro ao excluir especificação:', error);
            onAlert("Erro ao excluir especificação", "error");
        } finally {
            setIsDeleting(false);
            setIsDeleteSpecModalOpen(false);
            setSelectedSpec(null);
            onModalChange?.(operacao.id_operacao, 'deleteSpec', false);
        }
    }, [selectedSpec, onAlert, onRefresh, operacao.id_operacao, onModalChange]);
    // The user will explicitly save the order with the "Salvar Ordem" button
    return (
        <div className={`mb-6 border ${isReordering ? 'border-blue-200' : 'border-gray-100'} rounded-xl overflow-hidden shadow-sm relative`}>

            <div
                className={`flex justify-between items-center p-3 bg-white ${!isReordering && 'hover:bg-gray-50'} cursor-pointer transition-colors group`}
                role="button"
                onClick={toggleExpand}
                aria-expanded={isExpanded}
            >
                <h3 className="flex items-center text-sm font-medium text-gray-800">
                    <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center mr-2">
                        {operacao.operacao}
                    </div>
                    {operacao.descricao_operacao}
                </h3>
                <div className="flex items-center gap-3">
                    <div className="flex items-center text-xs text-gray-600">
                        <Clock className="w-3.5 h-3.5 mr-1" />
                        Frequência: {operacao.frequencia_minutos} min
                    </div>
                    {/* Action buttons */}
                    <div className="flex items-center gap-2 relative z-10 transition-opacity group-hover:opacity-100">
                        {isExpanded ? (
                            // Botões quando expandido (Reordenar e Cadastrar)
                            <div className="flex items-center gap-2">                                {/* Reordenar */}
                                <motion.button
                                    whileTap={{ scale: 0.97 }}
                                    disabled={especificacoesCountValue <= 1}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setIsReordering(!isReordering);
                                    }} className={`p-1.5 px-3 rounded-md text-white transition-colors shadow-sm flex items-center gap-2 ${isReordering ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-500 hover:bg-blue-600'} ${especificacoesCountValue <= 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="21" y1="10" x2="3" y2="10"></line>
                                        <line x1="21" y1="6" x2="3" y2="6"></line>
                                        <line x1="21" y1="14" x2="3" y2="14"></line>
                                        <line x1="21" y1="18" x2="3" y2="18"></line>                                    </svg>
                                    <span className="text-xs font-medium hidden md:inline">
                                        {isReordering ? "Reordenando" : "Reordenar"}
                                    </span>
                                </motion.button>                                {/* Cadastrar */}
                                <motion.button
                                    whileTap={{ scale: 0.97 }}
                                    disabled={isReordering}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        if (!isReordering) {
                                            setIsSpecModalOpen(true);
                                        }
                                    }} className={`p-1.5 md:px-3 rounded-md text-white transition-colors shadow-sm flex items-center gap-2 ${isReordering ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'}`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                    </svg>
                                    <span className="text-xs font-medium hidden md:inline">Cadastrar Espec.</span>
                                </motion.button>
                            </div>
                        ) : (
                            // Botões quando fechado (Editar e Excluir)
                            <div className="flex items-center gap-2">
                                <motion.button
                                    whileTap={{ scale: 0.97 }}
                                    disabled={!onEdit}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        if (onEdit) onEdit(operacao);
                                    }} className={`p-1.5 rounded-md transition-colors ${!onEdit ? 'text-gray-400 bg-gray-100 cursor-not-allowed opacity-50' : 'text-gray-700 hover:text-yellow-500 hover:bg-yellow-50'}`}
                                >
                                    <Pencil className="h-3.5 w-3.5" />
                                </motion.button>

                                <motion.button
                                    whileTap={{ scale: 0.97 }}
                                    disabled={!onDelete}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        if (onDelete) onDelete(operacao);
                                    }} className={`p-1.5 rounded-md transition-colors ${!onDelete ? 'text-gray-400 bg-gray-100 cursor-not-allowed opacity-50' : 'text-gray-700 hover:text-red-500 hover:bg-red-50'}`}
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </motion.button>

                            </div>
                        )}
                    </div>

                    {/* Chevron indicator */}
                    <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : 'rotate-0'}`}>
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                    </div>
                </div>
            </div>

            {isExpanded && (
                <>
                    {/* Modal de Especificações */}
                    <EspecificacoesModal
                        isOpen={isSpecModalOpen}
                        onClose={() => {
                            setIsSpecModalOpen(false);
                            setSelectedSpec(null);
                            onModalChange?.(operacao.id_operacao, 'spec', false);
                        }}
                        dados={selectedSpec ? {
                            ...selectedSpec,
                            caracteristica_especial: selectedSpec.especificacao_caracteristica,
                            referencia,
                            roteiro,
                            processo: parseInt(processo, 10),
                            operacao: operacao.operacao
                        } : {
                            referencia,
                            roteiro,
                            processo: parseInt(processo, 10),
                            operacao: operacao.operacao
                        }} onSuccess={(message: string) => {
                            // Verificar se a mensagem é um JSON (edição) ou texto simples
                            try {
                                const jsonData = JSON.parse(message);
                                if (jsonData && typeof jsonData.message === 'string') {
                                    // É um objeto JSON de uma edição
                                    onAlert(jsonData.message, "success");
                                } else {
                                    onAlert("Operação realizada com sucesso!", "success");
                                }
                            } catch {
                                // É uma string simples
                                onAlert(message, "success");
                            }

                            // Atualizar a lista de especificações
                            onRefresh();

                            // Se a mensagem contém "continuar", não fechar o modal
                            if (!message.toLowerCase().includes("continuar")) {
                                setIsSpecModalOpen(false);
                                setSelectedSpec(null);
                                onModalChange?.(operacao.id_operacao, 'spec', false);
                            }
                        }}
                        modo={selectedSpec ? "edicao" : "cadastro"}
                        especificacoesList={selectedSpec ? undefined : especificacoes}
                    />
                    {/* Modal de confirmação de exclusão de especificação */}
                    <ConfirmDeleteModal
                        isOpen={isDeleteSpecModalOpen}
                        onClose={() => {
                            if (!isDeleting) {
                                setIsDeleteSpecModalOpen(false);
                                setSelectedSpec(null);
                                onModalChange?.(operacao.id_operacao, 'deleteSpec', false);
                            }
                        }}
                        onConfirm={confirmDeleteSpec}
                        isDeleting={isDeleting}
                        title="Confirmar Exclusão"
                        message={
                            selectedSpec
                                ? `Você está prestes a excluir permanentemente a especificação: ${selectedSpec.especificacao_cota}`
                                : "Deseja realmente excluir esta especificação?"
                        }
                        itemName={selectedSpec?.especificacao_cota}
                    />{especificacoesCountValue > 0 ? (<div className={`border-t border-gray-100 rounded-md overflow-hidden ${isReordering ? 'bg-blue-50' : ''}`}>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1200px]">
                                <thead><tr className={`text-[10px] font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200 ${isReordering ? 'bg-blue-100/70' : 'bg-gradient-to-r from-gray-50 to-gray-100'}`}>
                                    <th className="w-12 lg:w-16 px-3 py-3.5 text-center">
                                        {isReordering ? (
                                            <div className="flex items-center justify-center">
                                                <span className="bg-blue-600 text-white text-[9px] px-2 py-0.5 rounded-full animate-pulse">Reordenando</span>
                                            </div>
                                        ) : 'Ordem'}
                                    </th>
                                    <th className="w-14 lg:w-20 px-3 py-3.5 text-center">Cota</th>
                                    <th className="min-w-[200px] lg:min-w-[250px] px-4 py-3.5 text-left">Especificação</th>
                                    <th className="w-16 lg:w-20 px-3 py-3.5 text-center">Caract.</th>
                                    <th className="min-w-[180px] lg:min-w-[220px] px-4 py-3.5 text-left">Instrumento</th>
                                    <th className="min-w-[160px] lg:min-w-[200px] px-4 py-3.5 text-left">Valores</th>
                                    <th className="w-20 lg:w-24 px-3 py-3.5 text-center">Setup</th>
                                    <th className="w-20 lg:w-24 px-3 py-3.5 text-center">Qualidade</th>
                                    <th className="w-20 lg:w-24 px-3 py-3.5 text-center">Processo</th>
                                    <th className="w-24 lg:w-28 px-3 py-3.5 text-center">
                                        {isReordering ? "Mover" : "Ações"}
                                    </th>
                                </tr></thead>
                                <tbody className="divide-y divide-gray-100 bg-white">                                    {especificacoes.map((especificacao, index) => (
                                    <EspecificacaoCard
                                        key={`${especificacao.id}-${especificacao.tipo_valor}-${especificacao.valor_minimo}-${especificacao.valor_maximo}-${Date.now()}`}
                                        especificacao={especificacao}
                                        onEdit={handleEditSpec}
                                        onDelete={handleDeleteSpec}
                                        isReordering={isReordering}
                                        onMoveUp={moveSpecUp}
                                        onMoveDown={moveSpecDown}
                                        index={index}
                                        isLastItem={index === especificacoes.length - 1}
                                    />
                                ))}
                                </tbody>
                            </table>
                        </div>
                        {isReordering && (
                            <div className="flex justify-between items-center p-3 border-t border-gray-100">
                                <div className="text-sm text-gray-600">
                                    <span className="flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Mova as especificações para reordenar
                                    </span>
                                </div>                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setIsReordering(false)}
                                        className="px-2 md:px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors flex items-center gap-1.5"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="18" y1="6" x2="6" y2="18"></line>
                                            <line x1="6" y1="6" x2="18" y2="18"></line>
                                        </svg>
                                        <span className="hidden md:inline">Cancelar</span>
                                    </button>
                                    <button
                                        onClick={handleReorder}
                                        className="px-2 md:px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors flex items-center gap-1.5"
                                        disabled={isSaving}
                                    >
                                        {isSaving ? (<>
                                            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            <span className="hidden md:inline">Salvando...</span>
                                        </>
                                        ) : (
                                            <>
                                                <Check className="h-4 w-4" />
                                                <span className="hidden md:inline">Salvar Ordem</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>) : (
                        <div className="bg-white p-2 text-center border-t border-gray-100 rounded-md">
                            <div className="flex flex-col items-center justify-center">
                                <p className="text-xs text-gray-700 mb-2">Nenhuma especificação cadastrada para essa operação.</p>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default function ProcessoPage() {
    // Restrição de acesso para Gestor
    const authLoading = false;
    const hasPermission = (permission: string) => {
        try {
            const userDataStr = localStorage.getItem("userData") || sessionStorage.getItem("userData");
            if (!userDataStr) return false;
            const userData = JSON.parse(userDataStr);
            if (!userData || !userData.perfil_inspecao) return false;
            return userData.perfil_inspecao.includes(permission);
        } catch {
            return false;
        }
    };

    const router = useRouter(); const searchParams = useSearchParams();

    // Parâmetros da URL
    const referencia = searchParams?.get('referencia') || '';
    const roteiro = searchParams?.get('roteiro') || '';
    const processo = searchParams?.get('processo') || '';    // Estados
    const [isLoading, setIsLoading] = useState(true);
    const [alert, setAlert] = useState<AlertState>({ message: null, type: "success" });
    const [dadosProcesso, setDadosProcesso] = useState<ProcessoDetalhes | null>(null);
    const [isOperacaoModalOpen, setIsOperacaoModalOpen] = useState(false);
    const [selectedOperacao, setSelectedOperacao] = useState<OperacaoProcesso | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [operacaoToDelete, setOperacaoToDelete] = useState<OperacaoProcesso | null>(null);    // Estados para FAB global de especificações
    const [isFABSpecModalOpen, setIsFABSpecModalOpen] = useState(false);
    const [selectedOperacaoForFAB, setSelectedOperacaoForFAB] = useState<OperacaoProcesso | null>(null);
    const [isOperacaoSelectionModalOpen, setIsOperacaoSelectionModalOpen] = useState(false);

    // Estados para rastrear modais das seções de operação
    const [sectionModalsOpen, setSectionModalsOpen] = useState<Set<string>>(new Set());

    // Computed para verificar se algum modal está aberto (para ocultar FAB)
    const isAnyModalOpen = useMemo(() => {
        return isOperacaoModalOpen ||
            isDeleteModalOpen ||
            isOperacaoSelectionModalOpen ||
            isFABSpecModalOpen ||
            sectionModalsOpen.size > 0;
    }, [isOperacaoModalOpen, isDeleteModalOpen, isOperacaoSelectionModalOpen, isFABSpecModalOpen, sectionModalsOpen]);    // Função para limpar alertas
    const clearAlert = useCallback(() => {
        setAlert({ message: null, type: "success" });
    }, []);

    // Funções para rastrear modais das seções de operação
    const handleSectionModalChange = useCallback((operacaoId: number, modalType: 'spec' | 'deleteSpec', isOpen: boolean) => {
        const modalKey = `${operacaoId}-${modalType}`;
        setSectionModalsOpen(prev => {
            const newSet = new Set(prev);
            if (isOpen) {
                newSet.add(modalKey);
            } else {
                newSet.delete(modalKey);
            }
            return newSet;
        });
    }, []);// Carregar dados do processo
    const fetchProcessoData = useCallback(async () => {
        if (!referencia || !roteiro || !processo) {
            setAlert({
                message: "Parâmetros insuficientes para buscar os dados do processo",
                type: "error"
            });
            setIsLoading(false);
            return;
        } try {
            const data = await getProcessoDetalhes(
                { referencia, roteiro, processo }
            );
            setDadosProcesso(data);
        } catch (error) {
            console.error('Erro ao buscar dados do processo:', error);
            setAlert({
                message: error instanceof Error ? error.message : 'Erro desconhecido ao buscar dados',
                type: "error"
            });
        } finally {
            setIsLoading(false);
        }
    }, [referencia, roteiro, processo]);

    // Função para voltar à tela de especificações
    const handleVoltar = useCallback(() => {
        router.push(`/cadastros/especificacoes?referencia=${encodeURIComponent(referencia)}&autoSearch=true`);
    }, [router, referencia]);

    // Função para editar operação
    const handleEditOperacao = useCallback((operacao: OperacaoProcesso) => {
        setSelectedOperacao(operacao);
        setIsOperacaoModalOpen(true);
    }, []);

    // Função para excluir operação
    const handleDeleteOperacao = useCallback((operacao: OperacaoProcesso) => {
        setOperacaoToDelete(operacao);
        setIsDeleteModalOpen(true);
    }, []);

    // Função para confirmar a exclusão
    const confirmDeleteOperacao = useCallback(async () => {
        if (!operacaoToDelete) return;

        setIsDeleting(true);
        try {
            await deleteOperacaoProcesso(operacaoToDelete.id_operacao);
            setAlert({
                message: "Operação excluída com sucesso!",
                type: "success"
            });
            fetchProcessoData();
        } catch (error) {
            console.error('Erro ao excluir operação:', error);
            setAlert({
                message: error instanceof Error ? error.message : 'Erro ao excluir operação',
                type: "error"
            });
        } finally {
            setIsDeleting(false);
            setIsDeleteModalOpen(false);
            setOperacaoToDelete(null);
        }
    }, [operacaoToDelete, fetchProcessoData]);
    const handleCloseDeleteModal = useCallback(() => {
        if (!isDeleting) {
            setIsDeleteModalOpen(false);
            setOperacaoToDelete(null);
        }
    }, [isDeleting]);
    const handleOperacaoModalSuccess = useCallback((message: string) => {
        setAlert({ message, type: 'success' });
        fetchProcessoData();
        setIsOperacaoModalOpen(false);
        setSelectedOperacao(null);
    }, [fetchProcessoData]);
    const handleFABCreateSpec = useCallback(() => {
        const operacoesDisponiveis = dadosProcesso?.operacoes || [];

        if (operacoesDisponiveis.length === 0) {
            setAlert({
                message: "Nenhuma operação disponível para cadastrar especificação",
                type: "error"
            });
            return;
        }

        if (operacoesDisponiveis.length === 1) {
            // Se há apenas uma operação, use-a diretamente
            setSelectedOperacaoForFAB(operacoesDisponiveis[0]);
            setIsFABSpecModalOpen(true);
        } else {
            // Se há múltiplas operações, abra o modal de seleção
            setIsOperacaoSelectionModalOpen(true);
        }
    }, [dadosProcesso?.operacoes]);

    const handleSelectOperacaoForFAB = useCallback((operacao: OperacaoProcesso) => {
        setSelectedOperacaoForFAB(operacao);
        setIsOperacaoSelectionModalOpen(false);
        setIsFABSpecModalOpen(true);
    }, []); const handleFABModalSuccess = useCallback((message: string) => {
        // Verificar se a mensagem é um JSON (edição) ou texto simples (cadastro)
        try {
            const jsonData = JSON.parse(message);
            // É um objeto JSON de uma edição, extraímos apenas a mensagem de texto
            if (jsonData && typeof jsonData.message === 'string') {
                setAlert({ message: jsonData.message, type: 'success' });
            } else {
                // Se por algum motivo não tiver a propriedade message como esperado
                setAlert({ message: "Operação realizada com sucesso!", type: 'success' });
            }

            // Forçar atualização completa dos dados
            fetchProcessoData().then(() => {
                console.log('Dados atualizados após edição com ID:', jsonData.id);
            });
        } catch {
            // É uma string simples
            setAlert({ message, type: 'success' });

            // Para cadastro/exclusão, apenas atualiza normalmente
            fetchProcessoData();
        }
    }, [fetchProcessoData]);

    useEffect(() => {
        fetchProcessoData();
    }, [fetchProcessoData]);

    // Memoize the handler for reordering especificacoes to avoid recreating on each render
    const handleReorderEspecificacoes = useCallback(async (newOrder: EspecificacaoInspecao[]) => {
        // Prepare data for the API - just id and ordem fields
        const ordenedSpecs = newOrder.map((esp, index) => ({
            id: esp.id,
            ordem: index + 1
        }));
        await atualizarOrdemEspecificacoes(
            ordenedSpecs
        );

        // Reload data to reflect the changes
        return fetchProcessoData();
    }, [fetchProcessoData]);

    if (!hasPermission('G')) {
        return (
            <RestrictedAccess
                hasPermission={hasPermission('G')}
                isLoading={authLoading}
                customMessage="Esta página está disponível apenas para usuários com permissão de Gestor."
                redirectTo="/dashboard"
                redirectDelay={2000}
            />
        );
    } return (
        <div className="w-full space-y-5 p-2 sm:p-4 md:p-6">
            {/* Alerta para mensagens */}
            <AlertMessage
                message={alert.message}
                type={alert.type}
                onDismiss={clearAlert}
                autoDismiss={true}
                dismissDuration={5000}
            />

            {/* Cabeçalho da página */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div className="flex items-center">
                    <button
                        onClick={handleVoltar}
                        className="mr-3 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5 text-gray-500" />
                    </button>
                    <PageHeader
                        title="Especificações do Processo"
                        subtitle="Detalhes de especificações e operações"
                        showButton={false}
                    />
                </div>
            </div>

            {/* Conteúdo principal */}
            <AnimatePresence mode="wait">
                {isLoading ? (
                    <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 sm:p-8 mt-4 flex flex-col items-center justify-center text-center"
                    >
                        <motion.div
                            className="rounded-full bg-[#1ABC9C]/10 p-3 mb-3"
                            animate={{
                                scale: [1, 1.05, 1],
                                opacity: [1, 0.8, 1]
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                        >
                            <div className="w-6 h-6 rounded-full border-2 border-[#1ABC9C]/80 border-t-transparent animate-spin"></div>
                        </motion.div>
                        <h3 className="text-lg font-medium text-gray-900 mb-1">Buscando dados do processo...</h3>
                        <p className="text-gray-500 text-xs sm:text-sm">Aguarde enquanto carregamos as especificações.</p>
                    </motion.div>
                ) : dadosProcesso ? (
                    <motion.div
                        key="dados-processo"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="space-y-6"
                    >
                        {/* Informações do processo */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                            <div className="p-4 lg:p-6">
                                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
                                    {/* Referência */}
                                    <div className="flex items-start col-span-1 xl:col-span-2">
                                        <div className="mr-3 pt-1.5">
                                            <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
                                        </div>
                                        <div>
                                            <p className="text-sm">
                                                <span className="font-medium text-slate-600">Referência: </span>
                                                <span className="font-medium text-slate-800">{dadosProcesso.referencia}</span>
                                            </p>
                                            <p className="text-sm text-slate-700">{dadosProcesso.descricao}</p>
                                        </div>
                                    </div>

                                    {/* Roteiro */}
                                    <div className="flex items-start col-span-1 xl:col-span-2">
                                        <div className="mr-3 pt-1.5">
                                            <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
                                        </div>
                                        <div>
                                            <p className="text-sm">
                                                <span className="font-medium text-slate-600">Roteiro: </span>
                                                <span className="font-medium text-slate-800">{dadosProcesso.roteiro}</span>
                                            </p>
                                            <p className="text-sm text-slate-700">{dadosProcesso.nome_roteiro}</p>
                                        </div>
                                    </div>

                                    {/* Processo */}
                                    <div className="flex items-start">
                                        <div className="mr-3 pt-1.5">
                                            <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
                                        </div>
                                        <div>
                                            <p className="text-sm">
                                                <span className="font-medium text-slate-600">Processo: </span>
                                                <span className="font-medium text-slate-800">{dadosProcesso.processo}</span>
                                            </p>
                                            <p className="text-sm text-slate-600">({dadosProcesso.tipo_acao})</p>
                                        </div>
                                    </div>

                                    {/* Recurso */}
                                    <div className="flex items-start">
                                        <div className="mr-3 pt-1.5">
                                            <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
                                        </div>
                                        <div>
                                            <p className="text-sm">
                                                <span className="font-medium text-slate-600">Recurso: </span>
                                                <span className="font-medium text-slate-800">{dadosProcesso.recurso}</span>
                                            </p>
                                        </div>
                                    </div>

                                    {/* Setor */}
                                    <div className="flex items-start">
                                        <div className="mr-3 pt-1.5">
                                            <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
                                        </div>
                                        <div>
                                            <p className="text-sm">
                                                <span className="font-medium text-slate-600">Setor: </span>
                                                <span className="font-medium text-slate-800">{dadosProcesso.setor}</span>
                                            </p>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </div>
                        {/* Operações e especificações */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 px-4 lg:px-6 py-3 gap-3">
                                <div className="flex items-center">
                                    <div className="h-4 w-1 bg-green-800 rounded-full mr-2"></div>
                                    <h2 className="text-sm font-medium text-gray-800">Operações e Especificações</h2>
                                </div>

                                <button
                                    onClick={() => setIsOperacaoModalOpen(true)}
                                    className="px-3 py-1.5 text-xs font-medium text-white bg-[#1ABC9C] hover:bg-[#16A085] rounded-md transition-colors whitespace-nowrap"
                                >
                                    Adicionar Operação
                                </button>
                            </div>

                            <div className="p-3 lg:p-4">
                                {dadosProcesso.operacoes.length > 0 ? (
                                    <div className="space-y-4 lg:space-y-6">
                                        {dadosProcesso.operacoes.map(operacao => (
                                            <OperacaoSection
                                                key={operacao.id_operacao}
                                                operacao={operacao}
                                                initialExpanded={dadosProcesso.operacoes.length === 1}
                                                referencia={referencia}
                                                roteiro={roteiro}
                                                processo={processo}
                                                onAlert={(message, type) => setAlert({ message, type })}
                                                onRefresh={fetchProcessoData}
                                                onEdit={handleEditOperacao}
                                                onDelete={handleDeleteOperacao}
                                                onReorder={handleReorderEspecificacoes}
                                                onModalChange={handleSectionModalChange}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-8 flex flex-col items-center justify-center text-center">
                                        <div className="rounded-full bg-gray-100 p-2.5 mb-3">
                                            <ListFilter className="h-6 w-6 text-gray-400" />
                                        </div>
                                        <h3 className="text-base font-medium text-gray-900 mb-1">Nenhuma operação encontrada</h3>
                                        <p className="text-gray-500 text-sm">Não existem operações disponíveis para este processo.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="erro"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="bg-white rounded-xl shadow-lg border border-red-100 p-6 sm:p-8 mt-4 flex flex-col items-center justify-center text-center"
                    >
                        <div className="rounded-full bg-red-100 p-3 mb-3">
                            <AlertCircle className="h-6 w-6 text-red-500" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-1">Dados não encontrados</h3>
                        <p className="text-gray-500 text-xs sm:text-sm max-w-md">Não foi possível obter os dados para o processo. Verifique os parâmetros ou tente novamente.</p>
                        <button
                            onClick={fetchProcessoData}
                            className="mt-3 px-3 py-1.5 bg-[#1ABC9C] text-white rounded-md hover:bg-[#16A085] transition-colors text-xs"
                        >
                            Tentar novamente
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
            {dadosProcesso && (
                <OperacoesModal
                    isOpen={isOperacaoModalOpen}
                    onClose={() => {
                        setIsOperacaoModalOpen(false);
                        setSelectedOperacao(null);
                    }} dados={selectedOperacao ? {
                        referencia,
                        roteiro,
                        processo: parseInt(processo, 10),
                        tipo_acao: dadosProcesso?.tipo_acao || '',
                        operacao: selectedOperacao.operacao,
                        id: selectedOperacao.id_operacao,
                        descricao: selectedOperacao.descricao_operacao,
                        frequencia_minutos: selectedOperacao.frequencia_minutos
                    } : {
                        referencia,
                        roteiro,
                        processo: parseInt(processo, 10),
                        tipo_acao: dadosProcesso?.tipo_acao || '',
                        operacao: 0
                    }} onSuccess={handleOperacaoModalSuccess}
                    modo={selectedOperacao ? 'edicao' : 'cadastro'}
                />
            )}
            {/* Modal de confirmação de exclusão */}
            {isDeleteModalOpen && (
                <ConfirmDeleteModal
                    isOpen={isDeleteModalOpen}
                    onClose={handleCloseDeleteModal}
                    onConfirm={confirmDeleteOperacao}
                    isDeleting={isDeleting}
                    title="Confirmar Exclusão"
                    message={
                        operacaoToDelete
                            ? `Você está prestes a excluir permanentemente a operação: ${operacaoToDelete.descricao_operacao}`
                            : "Deseja realmente excluir esta operação?"
                    }
                    itemName={operacaoToDelete?.descricao_operacao}
                />
            )}
            {/* Modal de seleção de operação para FAB */}
            <OperacaoSelectionModal
                isOpen={isOperacaoSelectionModalOpen}
                onClose={() => setIsOperacaoSelectionModalOpen(false)}
                operacoes={dadosProcesso?.operacoes || []}
                onSelectOperacao={handleSelectOperacaoForFAB}
            />

            {/* Modal FAB para Especificações */}
            {selectedOperacaoForFAB && (
                <EspecificacoesModal
                    isOpen={isFABSpecModalOpen}
                    onClose={() => {
                        setIsFABSpecModalOpen(false);
                        setSelectedOperacaoForFAB(null);
                    }}
                    dados={{
                        referencia,
                        roteiro,
                        processo: parseInt(processo, 10),
                        operacao: selectedOperacaoForFAB.operacao
                    }}
                    onSuccess={handleFABModalSuccess}
                    modo="cadastro"
                    especificacoesList={selectedOperacaoForFAB.especificacoes_inspecao || []}
                />
            )}
            {/* Floating Action Button para Especificações */}
            {dadosProcesso && dadosProcesso.operacoes && dadosProcesso.operacoes.length > 0 && !isAnyModalOpen && (
                <FloatingActionButton
                    onClick={handleFABCreateSpec}
                    tooltip="Nova Especificação"
                    color="green"
                    icon="plus"
                    size="lg"
                />
            )}
        </div>
    );
}
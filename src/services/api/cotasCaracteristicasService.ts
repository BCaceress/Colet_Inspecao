import { CotaCaracteristica } from "@/types/cadastros/cotaCaracteristica";
import { fetchWithAuth } from "./authInterceptor";

export const getCotasCaracteristicas = async (): Promise<CotaCaracteristica[]> => {
    const apiUrl = localStorage.getItem("apiUrl");
    if (!apiUrl) {
        throw new Error("URL da API não está configurada");
    }

    const response = await fetchWithAuth(`${apiUrl}/inspecao/cotas_caracteristicas`, {
        method: 'GET'
    });

    if (!response.ok) {
        throw new Error(`Erro ao buscar dados: ${response.status}`);
    } const data = await response.json(); return Array.isArray(data) ? data.map(item => {
        const id = item.id !== undefined && item.id !== null ? Number(item.id) : 0;
        return {
            id: id,
            descricao: item.descricao || '',
            tipo: item.tipo || '',
            simbolo_path_svg: item.simbolo_path_svg || '',
            unidade_medida: item.unidade_medida || '',
            rejeita_menor: item.rejeita_menor || '',
            rejeita_maior: item.rejeita_maior || '',
            local_inspecao: item.local_inspecao || null
        };
    }) : [];
};

export const createCotaCaracteristica = async (
    cotaCaracteristica: Omit<CotaCaracteristica, 'id'>
): Promise<CotaCaracteristica> => {
    const apiUrl = localStorage.getItem("apiUrl");
    if (!apiUrl) {
        throw new Error("URL da API não está configurada");
    }

    const response = await fetchWithAuth(`${apiUrl}/inspecao/cotas_caracteristicas`, {
        method: 'POST',
        body: JSON.stringify({
            descricao: cotaCaracteristica.descricao,
            tipo: cotaCaracteristica.tipo,
            simbolo_path_svg: cotaCaracteristica.simbolo_path_svg,
            unidade_medida: cotaCaracteristica.unidade_medida,
            rejeita_menor: cotaCaracteristica.rejeita_menor === true || cotaCaracteristica.rejeita_menor === "s" || cotaCaracteristica.rejeita_menor === "S" ? "s" : "n",
            rejeita_maior: cotaCaracteristica.rejeita_maior === true || cotaCaracteristica.rejeita_maior === "s" || cotaCaracteristica.rejeita_maior === "S" ? "s" : "n",
            local_inspecao: cotaCaracteristica.tipo === "O" ? cotaCaracteristica.local_inspecao : null
        }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erro ao criar: ${response.status}`);
    }

    return await response.json();
};

export const updateCotaCaracteristica = async (
    cotaCaracteristica: CotaCaracteristica
): Promise<CotaCaracteristica> => {
    const apiUrl = localStorage.getItem("apiUrl");
    if (!apiUrl) {
        throw new Error("URL da API não está configurada");
    }

    const response = await fetchWithAuth(`${apiUrl}/inspecao/cotas_caracteristicas?id=${cotaCaracteristica.id}`, {
        method: 'PUT',
        body: JSON.stringify({
            id: cotaCaracteristica.id,
            descricao: cotaCaracteristica.descricao,
            tipo: cotaCaracteristica.tipo,
            simbolo_path_svg: cotaCaracteristica.simbolo_path_svg,
            unidade_medida: cotaCaracteristica.unidade_medida,
            rejeita_menor: cotaCaracteristica.rejeita_menor === true || cotaCaracteristica.rejeita_menor === "s" || cotaCaracteristica.rejeita_menor === "S" ? "s" : "n",
            rejeita_maior: cotaCaracteristica.rejeita_maior === true || cotaCaracteristica.rejeita_maior === "s" || cotaCaracteristica.rejeita_maior === "S" ? "s" : "n",
            local_inspecao: cotaCaracteristica.tipo === "O" ? cotaCaracteristica.local_inspecao : null
        })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erro ao atualizar: ${response.status}`);
    }

    return await response.json();
};

export const deleteCotaCaracteristica = async (
    id: number
): Promise<void> => {
    const apiUrl = localStorage.getItem("apiUrl");
    if (!apiUrl) {
        throw new Error("URL da API não está configurada");
    }

    const response = await fetchWithAuth(`${apiUrl}/inspecao/cotas_caracteristicas?id=${id}`, {
        method: 'DELETE'
    });

    if (!response.ok) {
        let errorMessage = 'Erro desconhecido ao excluir o registro'; try {
            const errorData = await response.json();
            if (errorData && errorData.message) {
                errorMessage = errorData.message;
            } else if (errorData && errorData.error) {
                errorMessage = errorData.error;
            }
        } catch {

        }

        throw new Error(errorMessage || `Erro ao excluir: ${response.status} ${response.statusText}`);
    }
};
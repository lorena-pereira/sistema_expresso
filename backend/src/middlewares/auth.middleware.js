
export const verificarAutenticacao = (req, res, next) => {
    if (!req.session?.usuario) {
        return res.status(401).json({
            success: false,
            message: 'Acesso negado. Faça login para continuar.'
        });
    }

    next();
};

export const permitirPerfis = (...perfisPermitidos) => {
    return (req, res, next) => {
        if (!req.session?.usuario) {
            return res.status(401).json({
                success: false,
                message: 'Acesso negado. Faça login para continuar.'
            });
        }

        const perfilUsuario = req.session.usuario.perfil;

        if (!perfisPermitidos.includes(perfilUsuario)) {
            return res.status(403).json({
                success: false,
                message: 'Você não tem permissão para realizar esta operação.'
            });
        }

        next();
    };
};

using CasaDiAna.Application.Common;
using CasaDiAna.Domain.Entities;

namespace CasaDiAna.Application.Entradas.Common;

internal static class EntradaPermissao
{
    /// <summary>Só quem registrou a entrada ou um Admin pode acessá-la (consultar, editar ou cancelar).</summary>
    public static void GarantirAcesso(EntradaMercadoria entrada, ICurrentUserService usuario)
    {
        if (entrada.CriadoPor != usuario.UsuarioId && usuario.Papel != "Admin")
            throw new UnauthorizedAccessException("Acesso negado.");
    }
}

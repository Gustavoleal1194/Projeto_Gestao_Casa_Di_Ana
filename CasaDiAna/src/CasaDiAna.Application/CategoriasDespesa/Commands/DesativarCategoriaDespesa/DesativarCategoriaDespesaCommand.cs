using MediatR;

namespace CasaDiAna.Application.CategoriasDespesa.Commands.DesativarCategoriaDespesa;

public record DesativarCategoriaDespesaCommand(Guid Id) : IRequest;

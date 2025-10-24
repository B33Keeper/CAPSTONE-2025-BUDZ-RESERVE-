"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateCourtDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_court_dto_1 = require("./create-court.dto");
class UpdateCourtDto extends (0, swagger_1.PartialType)(create_court_dto_1.CreateCourtDto) {
}
exports.UpdateCourtDto = UpdateCourtDto;
//# sourceMappingURL=update-court.dto.js.map
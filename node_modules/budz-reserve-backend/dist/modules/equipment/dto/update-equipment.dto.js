"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateEquipmentDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_equipment_dto_1 = require("./create-equipment.dto");
class UpdateEquipmentDto extends (0, swagger_1.PartialType)(create_equipment_dto_1.CreateEquipmentDto) {
}
exports.UpdateEquipmentDto = UpdateEquipmentDto;
//# sourceMappingURL=update-equipment.dto.js.map
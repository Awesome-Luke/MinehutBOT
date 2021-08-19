import { Listener } from 'discord-akairo';
import { GuildMember } from 'discord.js';
import { guildConfigs } from '../../../guild/config/guildConfigs';
import { UnMuteAction } from '../../../structure/action/unMute';
import { CaseModel } from '../../../model/case';
import { CaseType } from '../../../util/constants';

export default class UnMuteByRoleRemovalListener extends Listener {
	constructor() {
		super('unMuteByRoleRemoval', {
			emitter: 'client',
			event: 'guildMemberUpdate',
		});
	}

	async exec(oldMember: GuildMember, newMember: GuildMember) {
		const mutedRole = guildConfigs.get(newMember.guild.id)?.roles.muted;
		if (!mutedRole) return;
		if (
			oldMember.roles.cache.has(mutedRole) &&
			!newMember.roles.cache.has(mutedRole)
		) {
			// Stop the flow if the member is not muted
			if (
				!(await CaseModel.exists({
					targetId: newMember.id,
					type: CaseType.Mute,
					active: true,
					guild: newMember.guild.id,
				}))
			)
				return;
			const action = new UnMuteAction({
				target: newMember,
				moderator: newMember.guild.members.resolve(this.client.user!)!,
				reason: `Manual role removal`,
				client: this.client,
				guild: newMember.guild,
			});
			action.commit();
		}
	}
}

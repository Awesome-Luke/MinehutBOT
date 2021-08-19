import { Message } from 'discord.js';
import { MinehutCommand } from '../../../structure/command/minehutCommand';
import { PermissionLevel } from '../../../util/permission/permissionLevel';
import { CaseModel } from '../../../model/case';
import { CaseType } from '../../../util/constants';
import { Argument } from 'discord-akairo';
import { User } from 'discord.js';
import { UnBanAction } from '../../../structure/action/unBan';

export default class UnBanCommand extends MinehutCommand {
	constructor() {
		super('unBan', {
			aliases: ['unban'],
			permissionLevel: PermissionLevel.Moderator,
			category: 'mod',
			channel: 'guild',
			clientPermissions: ['BAN_MEMBERS'],
			description: {
				content: 'Unban a user',
				usage: '<user> [...reason]',
				examples: ['@daniel', '@daniel accepted appeal'],
			},
			args: [
				{
					id: 'target',
					type: Argument.union('user', async (msg, phrase) => {
						try {
							return await msg.client.users.fetch(phrase);
						} catch {
							return null;
						}
					}),
					prompt: {
						start: (msg: Message) => `${msg.author}, who do you want to unban?`,
						retry: (msg: Message) => `${msg.author}, please mention a user.`,
					},
				},
				{
					id: 'reason',
					type: 'string',
					match: 'rest',
				},
			],
		});
	}

	async exec(
		msg: Message,
		{ target, reason }: { target: User; reason: string }
	) {
		if (
			!(await CaseModel.exists({
				targetId: target.id,
				$or: [{ type: CaseType.Ban }, { type: CaseType.ForceBan }],
				active: true,
				guild: msg.guild!.id,
			}))
		)
			return msg.channel.send(
				`${process.env.EMOJI_CROSS} this user is not currently banned`
			);
		const action = new UnBanAction({
			target: target,
			moderator: msg.member!,
			reason,
			client: this.client,
			guild: msg.guild!,
		});
		const c = await action.commit();
		msg.channel.send(
			`:ok_hand: unbanned ${action.target.tag} (\`${action.reason}\`) [${c?.id}]`
		);
	}
}

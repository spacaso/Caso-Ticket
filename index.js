const { Client, GatewayIntentBits, StringSelectMenuBuilder, ActionRowBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js')
require('dotenv').config()

const client = new Client({ intents: [GatewayIntentBits.Guilds] })

const PANEL_CHANNEL_ID = process.env.TICKET_CHANNEL_ID
const SUPPORT_ROLE = process.env.SUPPORT_ROLE_ID

const CATEGORY_MAP = {
  general_support: process.env.CATEGORY_GENERAL,
  billing_support: process.env.CATEGORY_BILLING,
  player_reports: process.env.CATEGORY_PLAYER,
  staff_reports: process.env.CATEGORY_STAFF,
  bug_reports: process.env.CATEGORY_BUG
}

client.once('ready', () => {
  console.log(`Bot is online as ${client.user.tag}`)
})

client.on('interactionCreate', async interaction => {
  if (!interaction.isStringSelectMenu()) return
  if (interaction.customId !== 'ticket_select') return

  const selected = interaction.values[0]
  const categoryId = CATEGORY_MAP[selected]

  const channel = await interaction.guild.channels.create({
    name: `${selected}-${interaction.user.username}`,
    type: 0,
    parent: categoryId,
    permissionOverwrites: [
      {
        id: interaction.guild.id,
        deny: [PermissionsBitField.Flags.ViewChannel]
      },
      {
        id: interaction.user.id,
        allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.SendMessages
        ]
      },
      {
        id: SUPPORT_ROLE,
        allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.SendMessages
        ]
      }
    ]
  })

  await channel.send({
    content: `Hey <@${interaction.user.id}> — thanks for reaching out!\nWe'll be with you shortly regarding **${selected.replace('_', ' ')}**.`
  })

  await interaction.reply({
    content: `✅ Your ticket has been opened: ${channel}`,
    ephemeral: true
  })
})

client.on('ready', async () => {
  const panelChannel = await client.channels.fetch(PANEL_CHANNEL_ID)

  const embed = new EmbedBuilder()
    .setColor('Blurple')
    .setTitle('Need help?')
    .setDescription('Select the type of support you need from the menu below.')

  const menu = new StringSelectMenuBuilder()
    .setCustomId('ticket_select')
    .setPlaceholder('Choose a ticket type...')
    .addOptions(
      {
        label: 'General Support',
        value: 'general_support'
      },
      {
        label: 'Billing Support',
        value: 'billing_support'
      },
      {
        label: 'Player Reports',
        value: 'player_reports'
      },
      {
        label: 'Staff Reports',
        value: 'staff_reports'
      },
      {
        label: 'Bug Reports',
        value: 'bug_reports'
      }
    )

  const row = new ActionRowBuilder().addComponents(menu)

  await panelChannel.send({ embeds: [embed], components: [row] })
})

client.login(process.env.BOT_TOKEN)


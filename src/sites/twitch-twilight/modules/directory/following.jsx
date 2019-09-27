'use strict';

// ============================================================================
// Following Page
// ============================================================================

import {SiteModule} from 'utilities/module';
import {createElement} from 'utilities/dom';
import {get} from 'utilities/object';

import Popper from 'popper.js';
import {makeReference} from 'utilities/tooltip';

/*import FOLLOWED_INDEX from './followed_index.gql';
import FOLLOWED_HOSTS from './followed_hosts.gql';
import FOLLOWED_CHANNELS from './followed_channels.gql';
import FOLLOWED_LIVE from './followed_live.gql';
import SUBSCRIBED_CHANNELS from './sidenav_subscribed.gql';
import RECOMMENDED_CHANNELS from './recommended_channels.gql';*/

export default class Following extends SiteModule {
	constructor(...args) {
		super(...args);

		this.inject('site.fine');
		this.inject('site.router');
		this.inject('site.apollo');
		this.inject('site.css_tweaks');

		this.inject('i18n');
		this.inject('settings');

		this.settings.add('directory.following.group-hosts', {
			default: true,

			ui: {
				path: 'Directory > Following >> Hosts',
				title: 'Group Hosts',
				description: 'Only show a given hosted channel once in the directory.',
				component: 'setting-check-box'
			},

			changed: () => {
				this.apollo.maybeRefetch('FollowedIndex_CurrentUser');
				this.apollo.maybeRefetch('FollowingHosts_CurrentUser');
			}
		});

		this.settings.add('directory.following.host-menus', {
			default: 1,

			ui: {
				path: 'Directory > Following >> Hosts',
				title: 'Hosted Channel Menus',
				description: 'Display a menu to select which channel to visit when clicking a hosted channel in the directory.',

				component: 'setting-select-box',

				data: [
					{value: 0, title: 'Disabled'},
					{value: 1, title: 'When Multiple are Hosting'},
					{value: 2, title: 'Always'}
				]
			},

			changed: () => this.parent.DirectoryCard.forceUpdate()
		});

		/*this.apollo.registerModifier('FollowedChannels_RENAME2', FOLLOWED_CHANNELS);
		this.apollo.registerModifier('SideNav_SubscribedChannels', SUBSCRIBED_CHANNELS);
		this.apollo.registerModifier('RecommendedChannels', RECOMMENDED_CHANNELS);

		this.apollo.registerModifier('FollowedIndex_CurrentUser', FOLLOWED_INDEX);
		this.apollo.registerModifier('FollowingLive_CurrentUser', FOLLOWED_LIVE);
		this.apollo.registerModifier('FollowingHosts_CurrentUser', FOLLOWED_HOSTS);

		this.apollo.registerModifier('FollowedChannels_RENAME2', res =>	this.modifyLiveUsers(res), false);
		this.apollo.registerModifier('SideNav_SubscribedChannels', res => this.modifyLiveUsers(res, 'subscribedChannels'), false);
		this.apollo.registerModifier('RecommendedChannels', res => this.modifyLiveUsers(res, 'recommendations.liveRecommendations'), false);

		this.apollo.registerModifier('FollowingLive_CurrentUser', res => this.modifyLiveUsers(res), false);
		this.apollo.registerModifier('FollowingHosts_CurrentUser', res => this.modifyLiveHosts(res), false);
		this.apollo.registerModifier('FollowedIndex_CurrentUser', res => {
			this.modifyLiveUsers(res);
			this.modifyLiveHosts(res);
		}, false);

		this.apollo.registerModifier('Shelves', res => {
			const shelves = get('data.shelves.edges', res);
			if ( ! Array.isArray(shelves) )
				return;

			for(const shelf of shelves) {
				const edges = get('node.content.edges', shelf);
				if ( ! Array.isArray(edges) )
					continue;

				shelf.node.content.edges = this.parent.processNodes(edges);
			}
		}, false);*/

		this.hosts = new WeakMap;
	}

	modifyLiveUsers(res, path = 'followedLiveUsers') {
		const followed_live = get(`data.currentUser.${path}`, res);
		if ( ! followed_live )
			return;

		if ( followed_live.nodes )
			followed_live.nodes = this.parent.processNodes(followed_live.nodes);

		else if ( followed_live.edges )
			followed_live.edges = this.parent.processNodes(followed_live.edges);

		return res;
	}

	modifyLiveHosts(res) {
		const blocked_games = this.settings.provider.get('directory.game.blocked-games', []),
			do_grouping = this.settings.get('directory.following.group-hosts'),
			edges = get('data.currentUser.followedHosts.nodes', res);

		if ( ! edges || ! edges.length )
			return res;

		this.hosts = new WeakMap();
		const out = [];

		for(const edge of edges) {
			if ( ! edge )
				continue;

			const node = edge.node || edge,
				hosted = node.hosting,
				stream = hosted && hosted.stream;

			if ( ! stream || stream.game && blocked_games.includes(stream.game.name) )
				continue;

			if ( ! stream.viewersCount ) {
				if ( ! do_grouping || ! this.hosts[hosted.login] )
					out.push(edge);
				continue;
			}

			const store = stream.viewersCount = new Number(stream.viewersCount || 0);

			store.createdAt = stream.createdAt;
			store.title = stream.title;
			//store.game = stream.game;

			if ( do_grouping ) {
				const host_nodes = this.hosts[hosted.login];
				if ( host_nodes ) {
					host_nodes.push(node);
					this.hosts.set(store, host_nodes);

				} else {
					this.hosts.set(store, this.hosts[hosted.login] = [node]);
					out.push(edge);
				}

			} else
				out.push(edge);
		}

		res.data.currentUser.followedHosts.nodes = out;
		return res;
	}

	ensureQueries () {
		/*this.apollo.ensureQuery(
			'FollowedChannels_RENAME2',
			'data.currentUser.followedLiveUsers.nodes.0.stream.createdAt'
		);

		this.apollo.ensureQuery(
			'SideNav_SubscribedChannels',
			'data.currentUser.subscribedChannels.edges.0.node.stream.createdAt'
		);

		this.apollo.ensureQuery(
			'RecommendedChannels',
			'data.currentUser.recommendations.liveRecommendations.nodes.0.createdAt'
		);*/

		/*if ( this.router.current_name !== 'dir-following' )
			return;

		const bit = this.router.match[1];

		if ( ! bit )
			this.apollo.ensureQuery(
				'FollowedIndex_CurrentUser',
				n =>
					get('data.currentUser.followedLiveUsers.nodes.0.stream.createdAt', n) !== undefined ||
					get('data.currentUser.followedHosts.nodes.0.hosting.stream.createdAt', n) !== undefined
			);

		/*else if ( bit === 'live' )
			this.apollo.ensureQuery(
				'FollowingLive_CurrentUser',
				'data.currentUser.followedLiveUsers.nodes.0.stream.createdAt'
			);*/

		/*else if ( bit === 'hosts' )
			this.apollo.ensureQuery(
				'FollowingHosts_CurrentUser',
				'data.currentUser.followedHosts.nodes.0.hosting.stream.createdAt'
			);*/
	}

	onEnable() {
		this.ensureQueries();

		document.body.addEventListener('click', this.destroyHostMenu.bind(this));
	}

	destroyHostMenu(event) {
		if (!event || ! this.hostMenu || event && event.target && event.target.closest('.ffz-channel-selector-outer') === null && Date.now() > this.hostMenuBuffer) {
			this.hostMenuPopper && this.hostMenuPopper.destroy();
			this.hostMenu && this.hostMenu.remove();
			this.hostMenuPopper = this.hostMenu = undefined;
		}
	}

	showHostMenu(inst, channels, event) {
		if (this.settings.get('directory.following.host-menus') === 0 || this.settings.get('directory.following.host-menus') === 1 && channels.length < 2) return;

		event.preventDefault();
		event.stopPropagation();

		this.hostMenuPopper && this.hostMenuPopper.destroy();

		this.hostMenu && this.hostMenu.remove();

		const simplebarContentChildren = [];

		// Hosted Channel Header
		simplebarContentChildren.push(<p class="tw-pd-t-05 tw-pd-x-1 tw-c-text-alt-2">
			{this.i18n.t('directory.hosted', 'Hosted Channel')}
		</p>);

		// Hosted Channel Content
		simplebarContentChildren.push(<a
			class="tw-block tw-border-radius-small tw-full-width tw-interactable tw-interactable--alpha tw-interactive"
			href={`/${inst.props.channelLogin}`}
			onClick={e => this.parent.hijackUserClick(e, inst.props.channelLogin, this.destroyHostMenu.bind(this))} // eslint-disable-line react/jsx-no-bind
		>
			<div class="tw-align-items-center tw-flex tw-flex-row tw-flex-nowrap tw-mg-x-1 tw-mg-y-05">
				<div class="ffz-channel-avatar">
					<img src={inst.props.channelImageProps.src} alt={inst.props.channelDisplayName} />
				</div>
				<p class="tw-ellipsis tw-flex-grow-1 tw-mg-l-1 tw-font-size-5">
					{inst.props.channelDisplayName}
				</p>
			</div>
		</a>);

		// Hosting Channels Header
		simplebarContentChildren.push(<p class="tw-pd-t-05 tw-pd-x-1 tw-c-text-alt-2">
			{this.i18n.t('directory.hosting', 'Hosting Channels')}
		</p>);

		// Hosting Channels Content
		for (const channel of channels) {
			simplebarContentChildren.push(<a
				class="tw-block tw-border-radius-small tw-full-width tw-interactable tw-interactable--alpha tw-interactive"
				href={`/${channel.login}`}
				onClick={e => this.parent.hijackUserClick(e, channel.login, this.destroyHostMenu.bind(this))} // eslint-disable-line react/jsx-no-bind
			>
				<div class="tw-align-items-center tw-flex tw-flex-row tw-flex-nowrap tw-mg-x-1 tw-mg-y-05">
					<div class="ffz-channel-avatar">
						<img src={channel.profileImageURL} alt={channel.displayName} />
					</div>
					<p class="tw-ellipsis tw-flex-grow-1 tw-mg-l-1 tw-font-size-5">
						{channel.displayName}
					</p>
				</div>
			</a>);
		}

		this.hostMenu = (<div class="ffz-host-menu tw-balloon tw-block">
			<div class="tw-border tw-elevation-1 tw-border-radius-small tw-c-background-base tw-pd-05">
				<div class="scrollable-area" data-simplebar>
					{simplebarContentChildren}
				</div>
			</div>
		</div>);

		const root = (document.body.querySelector('#root>div') || document.body);
		root.appendChild(this.hostMenu);

		this.hostMenuPopper = new Popper(
			makeReference(event.clientX - 60, event.clientY - 60),
			this.hostMenu,
			{
				placement: 'bottom-start',
				modifiers: {
					flip: {
						enabled: false
					}
				}
			}
		);

		this.hostMenuBuffer = Date.now() + 50;
	}

	updateChannelCard(inst) {
		const card = this.fine.getChildNode(inst);

		if ( ! card )
			return;

		const login = inst.props.channelLogin,
			hosting = inst.props.channelLinkTo && inst.props.channelLinkTo.state.content === 'live_host' && this.hosts && this.hosts[login];

		if ( hosting && this.settings.get('directory.following.group-hosts') ) {
			const host_data = this.hosts[login];

			const title_link = card.querySelector('a[data-test-selector="preview-card-titles__primary-link"]'),
				thumbnail_link = card.querySelector('a[data-a-target="preview-card-image-link"]');

			if ( title_link )
				title_link.addEventListener('click', this.showHostMenu.bind(this, inst, host_data));

			if ( thumbnail_link )
				thumbnail_link.addEventListener('click', this.showHostMenu.bind(this, inst, host_data));
		}
	}
}

import { useEffect, useState } from 'react';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import Box from '@mui/material/Box';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import UserProfile from '../(profile)/userProfile';
import { useChatSocket } from '@/app/context/chatSocketContext';
import { myAlert } from '../alert';
import { useRouter } from 'next/navigation';
import { GameJoinMode, GameMode } from '@/app/Enums';
import { clearSocketEvent, registerSocketEvent } from '@/app/context/socket';
import {
  EmitResult,
  Events,
  JoinStatus,
  UserPermission,
} from '@/app/interface';
import { setMyPermission } from '@/app/redux/roomSlice';
import { setCustomSet } from '@/app/redux/matchSlice';
import { setViewProfile } from '@/app/redux/viewSlice';
import { setChatRoom, setJoin } from '@/app/redux/userSlice';

const ChatMenu = () => {
  const chatRoom = useSelector((state: RootState) => state.user.chatRoom);
  const selectedMember = useSelector(
    (state: RootState) => state.room.selectedMember,
  );
  const memberList = useSelector(
    (state: RootState) => state.room.roomMemberList,
  );
  const myPermission = useSelector(
    (state: RootState) => state.room.myPermission,
  );
  const mySlackId = useSelector((state: RootState) => state.user.userSlackId);
  const [isUserProfileOpen, setUserProfileOpen] = useState<boolean>(false);
  const chatSocket = useChatSocket();
  const dispatch = useDispatch();
  const router = useRouter();

  useEffect(() => {
    const e: Events[] = [
      {
        event: 'getMyPermission',
        callback: (data: UserPermission) => {
          dispatch(setMyPermission(data));
        },
      },
      {
        event: 'kickUser',
        callback: (data: EmitResult) => {
          if (data.result === true) {
            dispatch(setChatRoom(null));
            dispatch(setJoin(JoinStatus.NONE));
            myAlert('success', '채팅방에서 쫓겨났습니다', dispatch);
          }
        },
      },
    ];
    registerSocketEvent(chatSocket!, e);
    chatSocket?.emit('getMyPermission', {
      roomName: chatRoom?.roomName,
      roomStatus: chatRoom?.status,
    });
    return () => {
      clearSocketEvent(chatSocket!, e);
    };
  }, []);

  // 프로필 버튼 클릭 핸들러
  const handleProfileClick = () => {
    setUserProfileOpen(true);
    dispatch(
      setViewProfile({
        viewProfile: true,
        targetSlackId: selectedMember?.slackId,
      }),
    );
  };

  // 모달 닫기 핸들러
  const handleCloseProfileModal = () => {
    setUserProfileOpen(false);
    dispatch(setViewProfile({ viewProfile: false, targetSlackId: null }));
  };

  const isSuper = () => {
    // if (selectedMember?.userName === 'jaejkim') {
    //   myAlert(
    //     'error',
    //     `${selectedMember?.userName}: 하 하 ~ 어림도 없죠? `,
    //     dispatch,
    //   );
    //   setTimeout(() => {
    //     router.push('/');
    //   }, 3000);
    // }
  };

  const handleGameClick = (mode: GameMode) => {
    dispatch(
      setCustomSet({
        joinMode: GameJoinMode.CUSTOM_SEND,
        gameMode: mode,
        opponentName: selectedMember?.userName,
        opponentSlackId: selectedMember?.slackId,
      }),
    );
    router.push('/game');
  };

  const handleKick = () => {
    isSuper();
    chatSocket?.emit('kickUser', {
      roomName: chatRoom?.roomName,
      targetName: selectedMember?.userName,
    });
  };

  const handleBan = () => {
    isSuper();
    chatSocket?.emit('banUser', {
      roomName: chatRoom?.roomName,
      roomStatus: chatRoom?.status,
      targetSlackId: selectedMember?.slackId,
    });
    myAlert(
      'info',
      `${selectedMember?.userName} banned from this room`,
      dispatch,
    );
  };

  const handleMute = () => {
    isSuper();
    const time = 5;
    chatSocket?.emit('muteUser', {
      status: chatRoom?.status,
      roomName: chatRoom?.roomName,
      targetName: selectedMember?.userName,
      time: time,
    });
    myAlert(
      'info',
      `${selectedMember?.userName} is muted for ${time} seconds`,
      dispatch,
    );
  };

  const handleToggleMakeAdmin = async () => {
    if (selectedMember?.permission === UserPermission.ADMIN) {
      chatSocket?.emit('ungrantUser', {
        roomName: chatRoom?.roomName,
        roomStatus: chatRoom?.status,
        targetName: selectedMember?.userName,
      });
    } else {
      chatSocket?.emit('grantUser', {
        roomName: chatRoom?.roomName,
        roomStatus: chatRoom?.status,
        targetName: selectedMember?.userName,
      });
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        '& > *': {
          m: 1,
        },
      }}
    >
      <ButtonGroup
        key="chatMenu"
        orientation="vertical"
        aria-label="vertical outlined button group"
      >
        <Button key="profile" onClick={handleProfileClick}>
          Profile
        </Button>

        {mySlackId !== selectedMember?.slackId ? (
          <>
            <Button
              key="gameNormal"
              onClick={() => {
                handleGameClick(GameMode.NORMAL);
              }}
            >
              Invite Game Normal
            </Button>
            <Button
              key="gameHard"
              onClick={() => {
                handleGameClick(GameMode.HARD);
              }}
            >
              Invite Game Hard
            </Button>
            {myPermission <= UserPermission.ADMIN &&
            myPermission < selectedMember!.permission ? (
              <>
                <Button key="kick" onClick={handleKick}>
                  Kick
                </Button>
                <Button key="ban" onClick={handleBan}>
                  Ban
                </Button>
                <Button key="mute" onClick={handleMute}>
                  Mute
                </Button>
              </>
            ) : null}
            {myPermission === UserPermission.OWNER ? (
              <Button key="makeOperator" onClick={handleToggleMakeAdmin}>
                관리자 만들기
              </Button>
            ) : null}
          </>
        ) : null}
      </ButtonGroup>
      {isUserProfileOpen && <UserProfile />}
    </Box>
  );
};

export default ChatMenu;

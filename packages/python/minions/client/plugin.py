from abc import ABC, abstractmethod
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from .client import Minions

class MinionPlugin(ABC):
    """
    Interface for developing Minions ecosystem plugins.
    Plugins can attach new namespaces and capabilities to the central `Minions` client.
    """
    
    @property
    @abstractmethod
    def namespace(self) -> str:
        """The namespace under which the plugin will be mounted (e.g., 'prompts' for minions.prompts)."""
        pass

    @abstractmethod
    def init(self, core: "Minions") -> Any:
        """
        Called during `Minions` instantiation.
        :param core: The central Minions client instance
        :return: The enhanced API object that will be mounted at the namespace
        """
        pass
